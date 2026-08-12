"""Number laboratory. No lottery prediction. Overfitting is flagged."""
from __future__ import annotations

import math
from collections import Counter
from itertools import combinations, permutations
from typing import Any

import numpy as np
import sympy as sp
from sympy import primerange

KNOWN_SEQ_HINTS = [
    ("natural", lambda n: list(range(1, n + 1))),
    ("even", lambda n: [2 * i for i in range(1, n + 1)]),
    ("odd", lambda n: [2 * i - 1 for i in range(1, n + 1)]),
    ("squares", lambda n: [i * i for i in range(1, n + 1)]),
    ("cubes", lambda n: [i**3 for i in range(1, n + 1)]),
    ("powers_of_2", lambda n: [2**i for i in range(n)]),
    ("fibonacci", lambda n: list(_fib(n))),
    ("primes", lambda n: list(primerange(1, 300))[:n]),
    ("triangular", lambda n: [i * (i + 1) // 2 for i in range(1, n + 1)]),
]


def _fib(n: int):
    a, b = 0, 1
    out = []
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out


def _is_int(x: float) -> bool:
    return abs(x - round(x)) < 1e-9


def factor_one(n: float) -> dict:
    if not _is_int(n):
        return {"n": n, "integer": False, "note": "Prime factorization is defined for integers."}
    z = int(round(n))
    sign = -1 if z < 0 else 1
    zabs = abs(z)
    if zabs <= 1:
        return {"n": z, "integer": True, "factors": {z: 1}, "latex": str(z)}
    fac = sp.factorint(zabs)
    latex = ("-" if sign < 0 else "") + sp.latex(sp.Mul(*[sp.Pow(p, e) for p, e in fac.items()], evaluate=False))
    return {"n": z, "integer": True, "factors": {str(k): int(v) for k, v in fac.items()}, "latex": latex}


def shannon_entropy(values: list[float]) -> float:
    c = Counter(values)
    n = len(values)
    return float(-sum((k / n) * math.log2(k / n) for k in c.values()))


def linear_recurrence_guess(seq: list[int], order: int = 2) -> dict | None:
    if len(seq) < order + 2:
        return None
    # Solve seq[n] = a1 seq[n-1] + ... for last few terms; check consistency.
    A = []
    b = []
    for i in range(order, len(seq)):
        A.append(seq[i - order : i][::-1] if False else seq[i - order : i])
        b.append(seq[i])
    try:
        coef, *_ = np.linalg.lstsq(np.array(A, dtype=float), np.array(b, dtype=float), rcond=None)
        preds = []
        ok = True
        for i in range(order, len(seq)):
            p = float(np.dot(coef, seq[i - order : i]))
            preds.append(p)
            if abs(p - seq[i]) > 1e-6:
                ok = False
        return {
            "order": order,
            "coefficients": [round(float(c), 8) for c in coef],
            "exact_on_sample": ok,
            "method": "least_squares_linear_recurrence",
            "overfit_risk": len(seq) <= order + 1,
        }
    except Exception:
        return None


def polynomial_fit(seq: list[float]) -> dict:
    n = len(seq)
    xs = np.arange(n, dtype=float)
    ys = np.array(seq, dtype=float)
    candidates = []
    for deg in range(0, min(n - 1, 5) + 1):
        coef = np.polyfit(xs, ys, deg)
        pred = np.polyval(coef, xs)
        mse = float(np.mean((pred - ys) ** 2))
        # extra point not used: we don't have it. Flag interpolation identity.
        interpolates = mse < 1e-18
        candidates.append(
            {
                "degree": deg,
                "coefficients_high_to_low": [round(float(c), 10) for c in coef],
                "mse_on_sample": mse,
                "interpolates_sample": interpolates,
                "overfit_warning": interpolates and deg >= n - 1,
                "certainty": "unproven_conjecture" if interpolates and deg >= 1 else "numerically_checked",
            }
        )
    # differences
    diffs = [list(ys)]
    cur = ys
    for _ in range(min(5, n - 1)):
        cur = np.diff(cur)
        diffs.append([round(float(v), 8) for v in cur])
        if len(cur) and np.allclose(cur, cur[0]):
            break
    return {"polynomial_candidates": candidates, "forward_differences": diffs}


def ratios(seq: list[float]) -> list[float | None]:
    out = []
    for a, b in zip(seq, seq[1:]):
        out.append(None if a == 0 else round(b / a, 8))
    return out


def known_sequence_match(seq: list[float]) -> list[dict]:
    if not all(_is_int(x) for x in seq):
        return []
    ints = [int(round(x)) for x in seq]
    n = len(ints)
    hits = []
    for name, gen in KNOWN_SEQ_HINTS:
        cand = gen(max(n, 12))
        if cand[:n] == ints:
            hits.append({"name": name, "match": "prefix", "certainty": "verified_math"})
        elif ints == cand[:n][::-1]:
            hits.append({"name": name, "match": "reversed_prefix", "certainty": "numerically_checked"})
        else:
            # subsequence / offset
            for off in range(0, min(20, len(cand))):
                if cand[off : off + n] == ints:
                    hits.append({"name": name, "match": f"offset_{off}", "certainty": "numerically_checked"})
                    break
    return hits


def graph_and_spectrum(seq: list[float]) -> dict:
    n = len(seq)
    if n < 2:
        return {}
    # complete graph weights = abs differences
    diffs = np.abs(np.subtract.outer(seq, seq))
    # simple circulant-like adjacency if consecutive
    A = np.zeros((n, n))
    for i in range(n - 1):
        A[i, i + 1] = A[i + 1, i] = 1
    try:
        eigs = np.linalg.eigvalsh(A)
        spec = [round(float(x), 8) for x in eigs]
    except Exception:
        spec = []
    fft = np.fft.rfft(np.array(seq, dtype=float) - np.mean(seq))
    mag = [round(float(abs(z)), 8) for z in fft]
    return {
        "path_graph_eigenvalues": spec,
        "pairwise_abs_diff_matrix": np.round(diffs, 6).tolist(),
        "dft_magnitudes_mean_centered": mag,
        "note": "Spectral quantities describe this finite list, not a hidden physical law.",
    }


def combine_to_one(seq: list[float], method: str) -> dict:
    xs = np.array(seq, dtype=float)
    methods = {
        "sum": float(xs.sum()),
        "product": float(np.prod(xs)),
        "mean": float(xs.mean()),
        "rms": float(np.sqrt(np.mean(xs**2))),
        "l1": float(np.sum(np.abs(xs))),
        "polynomial_base10_if_digits": None,
        "hash_mod_10e6": int(abs(hash(tuple(np.round(xs, 12)))) % 1_000_000),
    }
    if all(_is_int(x) and 0 <= x <= 9 for x in seq):
        methods["polynomial_base10_if_digits"] = int("".join(str(int(x)) for x in seq))
    if method not in methods:
        return {
            "ok": False,
            "error": f"Unknown method {method}",
            "available": list(methods.keys()),
            "certainty": "insufficient_info",
        }
    val = methods[method]
    return {
        "ok": True,
        "method": method,
        "value": val,
        "formula": {
            "sum": r"s=\sum_i x_i",
            "product": r"p=\prod_i x_i",
            "mean": r"\bar x = n^{-1}\sum_i x_i",
            "rms": r"\mathrm{rms}=\sqrt{n^{-1}\sum_i x_i^2}",
            "l1": r"\|x\|_1=\sum_i |x_i|",
            "polynomial_base10_if_digits": r"\sum_i x_i 10^{n-1-i}",
            "hash_mod_10e6": "Python hash modulo 10^6 — not a mathematical invariant across processes.",
        }.get(method, ""),
        "all_methods": methods,
        "certainty": "verified_math" if method != "hash_mod_10e6" else "partial",
        "note": "The map from k numbers to one number is many-to-one; inversion is not unique.",
    }


def one_to_many(value: float, k: int, constraints: dict) -> dict:
    k = max(2, min(int(k), 12))
    lo = float(constraints.get("min", 0))
    hi = float(constraints.get("max", 37))
    mode = constraints.get("mode", "sum_parts")
    solutions = []
    if mode == "sum_parts" and _is_int(value):
        # integer compositions of limited size — sample not enumerate all
        target = int(round(value))
        # equal split
        base = [lo] * k
        rem = target - lo * k
        if rem >= 0:
            vec = [lo] * k
            i = 0
            r = rem
            while r > 0 and i < k:
                room = hi - vec[i]
                take = min(room, r)
                vec[i] += take
                r -= take
                i += 1
            if r == 0 and all(lo <= v <= hi for v in vec):
                solutions.append({"tuple": vec, "rule": "greedy_fill_from_min"})
            eq = [target / k] * k
            solutions.append({"tuple": [round(x, 6) for x in eq], "rule": "equal_real_parts"})
        solutions.append(
            {
                "tuple": [value] + [0] * (k - 1),
                "rule": "inject_into_first_coordinate",
                "note": "Always works over reals without bounds.",
            }
        )
    elif mode == "digits" and _is_int(value):
        s = str(abs(int(round(value))))
        if len(s) == k:
            solutions.append({"tuple": [int(c) for c in s], "rule": "decimal_digits"})
        else:
            solutions.append(
                {
                    "note": f"Integer {value} does not have exactly {k} digits. Padding/splitting is a convention, not an inverse.",
                }
            )
    return {
        "ok": True,
        "input": value,
        "k": k,
        "constraints": {"min": lo, "max": hi, "mode": mode},
        "solutions_sample": solutions,
        "certainty": "partial",
        "warning": (
            "There is generally no unique inverse. The displayed tuples are examples consistent with the stated constraints, "
            "not 'the' hidden numbers. Random-looking data cannot be uniquely decoded."
        ),
    }


def analyze(numbers: list[float]) -> dict:
    if not numbers:
        return {
            "ok": False,
            "certainty": "insufficient_info",
            "error": "Provide at least one number.",
        }
    xs = [float(x) for x in numbers]
    arr = np.array(xs, dtype=float)
    n = len(xs)
    stats = {
        "count": n,
        "min": float(arr.min()),
        "max": float(arr.max()),
        "mean": float(arr.mean()),
        "median": float(np.median(arr)),
        "variance_sample": float(arr.var(ddof=1)) if n > 1 else 0.0,
        "std_sample": float(arr.std(ddof=1)) if n > 1 else 0.0,
        "entropy_bits": shannon_entropy(xs),
    }
    diffs = [round(xs[i + 1] - xs[i], 10) for i in range(n - 1)]
    fac = [factor_one(x) for x in xs]
    ints = all(_is_int(x) for x in xs)
    recs = []
    if ints and n >= 4:
        iseq = [int(round(x)) for x in xs]
        for order in (1, 2, 3):
            g = linear_recurrence_guess(iseq, order)
            if g:
                recs.append(g)
    poly = polynomial_fit(xs)
    known = known_sequence_match(xs)
    corr = None
    if n >= 3:
        idx = np.arange(n, dtype=float)
        if arr.std() > 0:
            corr = float(np.corrcoef(idx, arr)[0, 1])
    modular = None
    if ints:
        iseq = [int(round(x)) for x in xs]
        modular = {str(m): [v % m for v in iseq] for m in (2, 3, 5, 7, 10)}
    combos = None
    if n <= 6 and n >= 2:
        combos = {
            "combinations_count_n_choose_2": math.comb(n, 2),
            "permutations_count": math.factorial(n),
            "pair_sums_sample": [round(a + b, 6) for a, b in list(combinations(xs, 2))[:12]],
        }
    # next-term warning
    next_term_policy = {
        "allowed": False,
        "reason": (
            "If the generating rule is not given, infinitely many sequences extend any finite list. "
            "A polynomial of degree n-1 always interpolates n points, which is overfitting, not discovery. "
            "This lab will not predict lottery/random draws."
        ),
    }
    explanations = []
    if known:
        explanations.append({"kind": "known_sequence", "items": known, "certainty": "numerically_checked"})
    if recs:
        exact = [r for r in recs if r.get("exact_on_sample")]
        if exact:
            explanations.append({"kind": "linear_recurrence", "items": exact, "certainty": "numerically_checked"})
    constant_diff = n >= 2 and len(set(diffs)) == 1
    if constant_diff:
        explanations.append(
            {
                "kind": "arithmetic_progression",
                "difference": diffs[0],
                "certainty": "verified_math",
                "formula": rf"a_n = {xs[0]} + {diffs[0]}(n-1)",
            }
        )
    rats = [r for r in ratios(xs) if r is not None]
    if rats and n >= 3 and max(rats) - min(rats) < 1e-9:
        explanations.append(
            {
                "kind": "geometric_progression",
                "ratio": rats[0],
                "certainty": "verified_math",
                "formula": rf"a_n = {xs[0]}\cdot ({rats[0]})^{{n-1}}",
            }
        )
    if not explanations:
        explanations.append(
            {
                "kind": "no_unique_rule",
                "certainty": "insufficient_info",
                "note": "No unique simple closed form was identified. Several interpolants exist; they are not claimed as 'the' law.",
            }
        )

    return {
        "ok": True,
        "numbers": xs,
        "statistics": stats,
        "prime_factorization": fac,
        "first_differences": diffs,
        "ratios": ratios(xs),
        "modular": modular,
        "correlation_with_index": corr,
        "combinatorics": combos,
        "recurrences": recs,
        "polynomial_and_differences": poly,
        "known_sequences": known,
        "graph_spectrum": graph_and_spectrum(xs),
        "candidate_explanations": explanations,
        "next_term_policy": next_term_policy,
        "certainty": "numerically_checked" if explanations else "partial",
        "limitations": (
            "Finite lists do not determine a unique generating law. "
            "Statistical descriptors are exact for the sample, not predictions about a population."
        ),
    }
