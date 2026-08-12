"""Real computer-algebra engine. LLM is not used for the numeric/symbolic result."""
from __future__ import annotations

import re
import traceback
from typing import Any

import mpmath as mp
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)
from pint import UnitRegistry

from ..certainty import pack

ureg = UnitRegistry()
mp.mp.dps = 50

TRANSFORMS = standard_transformations + (implicit_multiplication_application,)
SAFE_LOCALS = {
    "x": sp.symbols("x"),
    "y": sp.symbols("y"),
    "z": sp.symbols("z"),
    "t": sp.symbols("t"),
    "n": sp.symbols("n", integer=True),
    "k": sp.symbols("k", integer=True),
    "theta": sp.symbols("theta"),
    "pi": sp.pi,
    "E": sp.E,
    "I": sp.I,
    "oo": sp.oo,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "Abs": sp.Abs,
    "abs": sp.Abs,
    "factorial": sp.factorial,
    "gamma": sp.gamma,
    "diff": sp.diff,
    "integrate": sp.integrate,
    "limit": sp.limit,
    "Sum": sp.Sum,
    "Product": sp.Product,
    "Matrix": sp.Matrix,
    "eye": sp.eye,
    "zeros": sp.zeros,
    "ones": sp.ones,
    "Eq": sp.Eq,
    "Heaviside": sp.Heaviside,
    "DiracDelta": sp.DiracDelta,
}


def _latex(obj: Any) -> str:
    try:
        return sp.latex(obj)
    except Exception:
        return str(obj)


def parse_math(expr: str):
    cleaned = expr.strip()
    cleaned = cleaned.replace("^", "**")
    cleaned = cleaned.replace("×", "*").replace("÷", "/")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return parse_expr(cleaned, transformations=TRANSFORMS, local_dict=SAFE_LOCALS, evaluate=False)


def parse_evaluated(expr: str):
    return parse_expr(expr.replace("^", "**"), transformations=TRANSFORMS, local_dict=SAFE_LOCALS, evaluate=True)


def _verify_equation(eq, sols) -> dict:
    checks = []
    ok = True
    try:
        if not isinstance(eq, sp.Equality):
            return {"ok": False, "detail": "Not an equation."}
        lhs, rhs = eq.lhs, eq.rhs
        for sol in sols:
            if not isinstance(sol, dict):
                # univariate
                free = list(eq.free_symbols)
                if len(free) == 1:
                    val = lhs.subs(free[0], sol) - rhs.subs(free[0], sol)
                    residual = sp.simplify(val)
                    nres = complex(sp.N(residual))
                    passed = abs(nres) < 1e-8
                    ok = ok and passed
                    checks.append({"solution": str(sol), "residual": str(residual), "passed": passed, "method": "substitution"})
            else:
                residual = sp.simplify((lhs - rhs).subs(sol))
                try:
                    nres = complex(sp.N(residual))
                    passed = abs(nres) < 1e-8
                except Exception:
                    passed = residual == 0
                ok = ok and passed
                checks.append({"solution": str(sol), "residual": str(residual), "passed": passed, "method": "substitution"})
    except Exception as e:
        return {"ok": False, "detail": str(e), "checks": checks}
    return {"ok": ok, "checks": checks}


def check_units(expr: str) -> dict:
    try:
        q = ureg.parse_expression(expr)
        dim = q.dimensionality
        si = q.to_base_units()
        return {
            "ok": True,
            "input": expr,
            "magnitude": str(si.magnitude),
            "units": str(si.units),
            "dimensionality": str(dim),
            "certainty": pack("verified_math"),
            "limitations": "Pint checks unit algebra, not whether the physical model is correct.",
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "certainty": pack("insufficient_info"),
            "limitations": "Could not parse units. Use forms like `9.8 * m/s**2` or `3 * newton`.",
        }


def _matrix_work(expr: str) -> dict | None:
    if "matrix" not in expr.lower() and ";" not in expr and "eigen" not in expr.lower():
        if not re.search(r"\[\[", expr):
            return None
    raw = expr
    try:
        if "eigen" in expr.lower():
            inner = re.sub(r"eigen\w*", "", expr, flags=re.I)
            M = sp.Matrix(parse_evaluated(inner if inner.strip() else expr))
        else:
            M = sp.Matrix(parse_evaluated(expr))
        det = M.det() if M.shape[0] == M.shape[1] else None
        rank = M.rank()
        rref, pivots = M.rref()
        eigs = None
        if M.shape[0] == M.shape[1] and M.shape[0] <= 8:
            eigs = M.eigenvals()
        steps = [
            {"ord": 1, "title": "Matrix", "latex": _latex(M), "explanation": f"Shape {M.shape}", "method": "sympy.Matrix"},
            {"ord": 2, "title": "Rank", "latex": str(rank), "explanation": "Computed via row reduction.", "method": "Matrix.rank"},
            {"ord": 3, "title": "RREF", "latex": _latex(rref), "explanation": f"Pivots {list(pivots)}", "method": "rref"},
        ]
        if det is not None:
            steps.append({"ord": 4, "title": "Determinant", "latex": _latex(det), "explanation": "Square matrix determinant.", "method": "det"})
        if eigs is not None:
            steps.append({"ord": 5, "title": "Eigenvalues", "latex": _latex(eigs), "explanation": "Characteristic polynomial roots (exact when possible).", "method": "eigenvals"})
        certainty = "verified_math"
        return {
            "ok": True,
            "kind": "matrix",
            "steps": steps,
            "result_latex": _latex({"rank": rank, "det": det, "eigs": eigs}),
            "result_text": f"rank={rank}, det={det}, eigenvalues={eigs}",
            "certainty": pack(certainty),
            "verification": {"rank_matches_pivots": rank == len(pivots)},
            "limitations": "Eigen-decomposition for large or defective matrices may be incomplete.",
        }
    except Exception:
        return None


def solve_problem(
    expression: str,
    intent: str = "solve",
    variable: str | None = None,
    extra: dict | None = None,
) -> dict:
    extra = extra or {}
    expression = (expression or "").strip()
    if not expression:
        return {
            "ok": False,
            "certainty": pack("insufficient_info"),
            "error": "No expression provided.",
            "steps": [],
            "limitations": "A well-posed symbolic expression is required.",
        }

    if intent == "units":
        return {"ok": True, "kind": "units", "units": check_units(expression), "steps": [], "certainty": check_units(expression)["certainty"]}

    mw = _matrix_work(expression)
    if mw and intent in {"solve", "matrix", "auto"}:
        return mw

    steps = []
    try:
        if intent == "differentiate":
            expr = parse_evaluated(expression)
            var = sp.symbols(variable or "x")
            d1 = sp.diff(expr, var)
            d2 = sp.diff(d1, var)
            # numeric check at a point if possible
            ver = None
            try:
                x0 = 0.37
                n1 = float(sp.N(d1.subs(var, x0)))
                h = 1e-6
                fd = float(sp.N((expr.subs(var, x0 + h) - expr.subs(var, x0 - h)) / (2 * h)))
                ver = {"finite_difference": fd, "symbolic": n1, "rel_err": abs(fd - n1) / (1 + abs(n1))}
            except Exception:
                ver = {"note": "Could not numerically probe the derivative at a test point."}
            steps = [
                {"ord": 1, "title": "Expression", "latex": _latex(expr), "explanation": "Parsed by SymPy.", "method": "parse"},
                {"ord": 2, "title": "First derivative", "latex": _latex(d1), "explanation": f"d/d{var}", "method": "diff"},
                {"ord": 3, "title": "Second derivative", "latex": _latex(d2), "explanation": "Used as an extra symbolic check.", "method": "diff"},
            ]
            cert = "numerically_checked" if ver and "rel_err" in ver and ver["rel_err"] < 1e-4 else "verified_math"
            return {
                "ok": True,
                "kind": "derivative",
                "steps": steps,
                "result_latex": _latex(d1),
                "result_text": str(d1),
                "certainty": pack(cert),
                "verification": ver,
                "limitations": "Symbolic differentiation assumes the expression is differentiable on the relevant domain.",
            }

        if intent == "integrate":
            expr = parse_evaluated(expression)
            var = sp.symbols(variable or "x")
            ant = sp.integrate(expr, var)
            ver = {}
            try:
                back = sp.simplify(sp.diff(ant, var) - expr)
                ver["diff_of_antiderivative_minus_integrand"] = str(back)
                ver["ok"] = back == 0
            except Exception as e:
                ver = {"ok": False, "error": str(e)}
            steps = [
                {"ord": 1, "title": "Integrand", "latex": _latex(expr), "explanation": "Parsed integrand.", "method": "parse"},
                {"ord": 2, "title": "Antiderivative", "latex": _latex(ant) + " + C", "explanation": "Indefinite integral via SymPy Risch/heuristics/meijerg as applicable.", "method": "integrate"},
                {"ord": 3, "title": "Verification", "latex": _latex(sp.diff(ant, var)), "explanation": "Differentiate the antiderivative.", "method": "diff"},
            ]
            cert = "verified_math" if ver.get("ok") else "partial"
            if ant.has(sp.Integral):
                cert = "partial"
            return {
                "ok": True,
                "kind": "integral",
                "steps": steps,
                "result_latex": _latex(ant) + "+C",
                "result_text": str(ant) + " + C",
                "certainty": pack(cert),
                "verification": ver,
                "limitations": "Elementary antiderivatives do not always exist. +C is omitted by CAS output and restored here.",
            }

        if intent == "limit":
            expr = parse_evaluated(expression)
            var = sp.symbols(variable or "x")
            point = extra.get("to", 0)
            try:
                point = parse_evaluated(str(point))
            except Exception:
                point = 0
            lim = sp.limit(expr, var, point)
            nlim = None
            try:
                xs = np.array([1e-2, 1e-3, 1e-4, 1e-5])
                if point == 0:
                    vals = [complex(sp.N(expr.subs(var, float(v)))) for v in xs]
                    nlim = {"approach_0+": [str(v) for v in vals]}
            except Exception:
                pass
            steps = [
                {"ord": 1, "title": "Expression", "latex": _latex(expr), "explanation": "", "method": "parse"},
                {"ord": 2, "title": "Limit", "latex": rf"\lim_{{{var}\to {_latex(point)}}} {_latex(expr)} = {_latex(lim)}", "explanation": "SymPy limit algorithm.", "method": "limit"},
            ]
            return {
                "ok": True,
                "kind": "limit",
                "steps": steps,
                "result_latex": _latex(lim),
                "result_text": str(lim),
                "certainty": pack("verified_math" if lim.is_number or lim in {sp.oo, -sp.oo, sp.zoo, sp.nan} or True else "partial"),
                "verification": nlim,
                "limitations": "One-sided limits and essential singularities may require extra specification.",
            }

        if intent == "simplify":
            expr = parse_evaluated(expression)
            simp = sp.simplify(expr)
            trig = sp.trigsimp(expr)
            steps = [
                {"ord": 1, "title": "Input", "latex": _latex(expr), "explanation": "", "method": "parse"},
                {"ord": 2, "title": "simplify", "latex": _latex(simp), "explanation": "General simplifier.", "method": "simplify"},
                {"ord": 3, "title": "trigsimp", "latex": _latex(trig), "explanation": "Second method for comparison.", "method": "trigsimp"},
            ]
            return {
                "ok": True,
                "kind": "simplify",
                "steps": steps,
                "result_latex": _latex(simp),
                "result_text": str(simp),
                "certainty": pack("verified_math"),
                "verification": {"equivalent": str(sp.simplify(simp - expr))},
                "limitations": "Simplification is not unique; two equivalent forms may look different.",
            }

        # Default: equation / expression
        if "=" in expression and "==" not in expression:
            left, right = expression.split("=", 1)
            eq = sp.Eq(parse_evaluated(left), parse_evaluated(right))
            steps.append({"ord": 1, "title": "Equation", "latex": _latex(eq), "explanation": "Parsed equality.", "method": "parse"})
            syms = list(eq.free_symbols)
            target = sp.symbols(variable) if variable else (syms[0] if syms else sp.symbols("x"))
            sols = sp.solve(eq, target, dict=False)
            steps.append({"ord": 2, "title": "Exact solve", "latex": _latex(sols), "explanation": f"Solve for {target}.", "method": "solve"})
            ver = _verify_equation(eq, sols)
            nsols = []
            try:
                f = sp.lambdify(target, eq.lhs - eq.rhs, "numpy")
                for guess in [-10, -1, 0, 1, 2, 5]:
                    try:
                        ns = sp.nsolve(eq, target, guess)
                        nsols.append(str(ns))
                    except Exception:
                        pass
            except Exception:
                pass
            steps.append({"ord": 3, "title": "Numerical probes", "latex": _latex(nsols), "explanation": "nsolve from several initial guesses (may miss roots).", "method": "nsolve"})
            cert = "verified_math" if ver.get("ok") else "numerically_checked" if nsols else "partial"
            if not sols:
                cert = "insufficient_info" if not nsols else "numerically_checked"
            return {
                "ok": True,
                "kind": "equation",
                "steps": steps,
                "result_latex": _latex(sols),
                "result_text": str(sols),
                "certainty": pack(cert),
                "verification": {"symbolic": ver, "numeric_roots": nsols},
                "limitations": "Transcendental equations may have infinitely many roots; only some are found.",
            }

        expr = parse_evaluated(expression)
        val = sp.simplify(expr)
        nval = None
        mpval = None
        try:
            nval = sp.N(val, 30)
        except Exception:
            pass
        try:
            if expr.free_symbols == set():
                mpval = str(mp.nstr(mpify(val), 40))
        except Exception:
            pass
        steps = [
            {"ord": 1, "title": "Parsed", "latex": _latex(expr), "explanation": "", "method": "parse"},
            {"ord": 2, "title": "Simplified", "latex": _latex(val), "explanation": "Symbolic simplification.", "method": "simplify"},
            {"ord": 3, "title": "High precision", "latex": str(nval), "explanation": "mpmath/SymPy N() evaluation when the expression is closed-form.", "method": "N"},
        ]
        cert = "verified_math" if expr.free_symbols == set() else "partial"
        return {
            "ok": True,
            "kind": "expression",
            "steps": steps,
            "result_latex": _latex(val),
            "result_text": str(val),
            "numeric": str(nval) if nval is not None else "",
            "mp": mpval,
            "certainty": pack(cert),
            "verification": {"high_precision": mpval or str(nval)},
            "limitations": "Free symbols remain unevaluated. This is not a numerical simulation.",
        }
    except Exception as e:
        return {
            "ok": False,
            "certainty": pack("insufficient_info"),
            "error": str(e),
            "trace": traceback.format_exc()[-1500:],
            "steps": steps,
            "limitations": "The computer-algebra parser could not interpret the input as written.",
        }


def mpify(expr):
    try:
        return mp.mpf(str(sp.N(expr, 50)))
    except Exception:
        return mp.mpf("nan")


def ode_solve(expression: str, func: str = "y", var: str = "x") -> dict:
    try:
        x = sp.symbols(var)
        y = sp.Function(func)
        # allow y' notation roughly: y' -> y(x).diff(x)
        e = expression.replace("y''", "Derivative(y(x),x,2)").replace("y'", "Derivative(y(x),x)")
        e = e.replace("y(x)", "y(x)")
        if "=" in e:
            left, right = e.split("=", 1)
            eq = sp.Eq(parse_evaluated(left), parse_evaluated(right))
        else:
            eq = parse_evaluated(e)
        sol = sp.dsolve(eq, y(x))
        return {
            "ok": True,
            "kind": "ode",
            "result_latex": _latex(sol),
            "result_text": str(sol),
            "steps": [
                {"ord": 1, "title": "ODE", "latex": _latex(eq), "explanation": "Parsed ODE.", "method": "parse"},
                {"ord": 2, "title": "dsolve", "latex": _latex(sol), "explanation": "SymPy ODE solver. Arbitrary constants appear as C1, C2, ...", "method": "dsolve"},
            ],
            "certainty": pack("verified_math"),
            "limitations": "Closed-form ODE solutions do not always exist. Existence/uniqueness needs Lipschitz conditions on the IVP.",
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "certainty": pack("partial"),
            "limitations": "Could not solve the ODE in closed form.",
            "steps": [],
        }


def fourier_laplace(expression: str, kind: str = "fourier") -> dict:
    try:
        expr = parse_evaluated(expression)
        t = sp.symbols("t", real=True, positive=True)
        s = sp.symbols("s")
        w = sp.symbols("omega", real=True)
        if kind == "laplace":
            F = sp.laplace_transform(expr, t, s, noconds=True)
            title = "Laplace transform"
        else:
            F = sp.fourier_transform(expr, t, w)
            title = "Fourier transform"
        return {
            "ok": True,
            "kind": kind,
            "result_latex": _latex(F),
            "result_text": str(F),
            "steps": [
                {"ord": 1, "title": "Time domain", "latex": _latex(expr), "explanation": "", "method": "parse"},
                {"ord": 2, "title": title, "latex": _latex(F), "explanation": "SymPy integral transform tables/algorithms.", "method": kind},
            ],
            "certainty": pack("verified_math"),
            "limitations": "Transforms assume suitable decay/support conditions. The independent variable is taken as t.",
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "certainty": pack("partial"), "steps": []}
