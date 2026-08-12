"""Explore what lies between two reals. Density facts are theorems; pictures are illustrations."""
from __future__ import annotations

import math
from fractions import Fraction

import numpy as np
import sympy as sp


def farey(n: int) -> list[str]:
    a, b, c, d = 0, 1, 1, n
    out = [f"0/1"]
    while c <= n:
        k = (n + b) // d
        a, b, c, d = c, d, k * c - a, k * d - b
        out.append(f"{a}/{b}")
        if a == 1 and b == 1:
            break
    return out


def continued_fraction(x: float, terms: int = 8) -> list[int]:
    out = []
    for _ in range(terms):
        ai = math.floor(x)
        out.append(ai)
        frac = x - ai
        if abs(frac) < 1e-12:
            break
        x = 1 / frac
        if abs(x) > 1e12:
            break
    return out


def irrationals_named(a: float, b: float) -> list[dict]:
    named = {
        "sqrt(2)": math.sqrt(2),
        "sqrt(3)": math.sqrt(3),
        "golden_ratio": (1 + math.sqrt(5)) / 2,
        "e": math.e,
        "pi": math.pi,
        "ln(2)": math.log(2),
        "sqrt(2)/2": math.sqrt(2) / 2,
        "pi/2": math.pi / 2,
        "e-2": math.e - 2,
    }
    hits = []
    lo, hi = min(a, b), max(a, b)
    for name, val in named.items():
        if lo < val < hi:
            hits.append({"name": name, "value": val, "certainty": "verified_math"})
    return hits


def explore(a: float, b: float, depth: int = 4, zoom: float = 1.0) -> dict:
    if a == b:
        return {
            "ok": False,
            "certainty": "contradiction_impossible",
            "error": "The open interval (a,a) is empty. Choose two distinct numbers.",
        }
    lo, hi = (a, b) if a < b else (b, a)
    width = hi - lo
    # zoom into the midpoint neighborhood
    mid = (lo + hi) / 2
    view_w = width / max(zoom, 1.0)
    vlo, vhi = mid - view_w / 2, mid + view_w / 2
    vlo = max(vlo, lo)
    vhi = min(vhi, hi)

    farey_n = min(12 + int(depth) * 3, 40)
    farey_seq = farey(farey_n)
    rationals = []
    for item in farey_seq:
        p, q = item.split("/")
        val = int(p) / int(q)
        if vlo < val < vhi:
            rationals.append({"frac": item, "value": val})

    # extra dyadics
    dyadics = []
    levels = min(int(depth) + 3, 10)
    for k in range(1, levels + 1):
        den = 2**k
        for num in range(1, den):
            val = num / den
            if vlo < val < vhi:
                dyadics.append({"frac": f"{num}/{den}", "value": val, "level": k})

    samples = np.linspace(vlo, vhi, 25).tolist()
    decimals = [{"x": x, "decimal": format(x, ".18f")} for x in samples]

    # Cantor-like illustration on [0,1] if interval overlaps
    cantor_segments = [{"start": 0.0, "end": 1.0}]
    for _ in range(min(depth, 6)):
        nxt = []
        for seg in cantor_segments:
            w = seg["end"] - seg["start"]
            nxt.append({"start": seg["start"], "end": seg["start"] + w / 3})
            nxt.append({"start": seg["start"] + 2 * w / 3, "end": seg["end"]})
        cantor_segments = nxt

    theorems = [
        {
            "title": "Density of rationals",
            "statement": "Between any two reals there exists a rational (in fact infinitely many).",
            "certainty": "verified_math",
        },
        {
            "title": "Density of irrationals",
            "statement": "Between any two reals there exists an irrational (in fact infinitely many).",
            "certainty": "verified_math",
        },
        {
            "title": "Uncountability",
            "statement": "The set of reals in (a,b) is uncountable; the rationals in (a,b) are countable.",
            "certainty": "verified_math",
        },
        {
            "title": "No immediate successor",
            "statement": "There is no 'next' real after a. Infinite divisibility is a theorem of R, not a physical process.",
            "certainty": "verified_math",
        },
    ]

    return {
        "ok": True,
        "interval": {"a": lo, "b": hi, "open": True},
        "view": {"left": vlo, "right": vhi, "zoom": zoom, "mid": mid},
        "width": width,
        "farey_rationals_in_view": rationals[:80],
        "dyadics_in_view": dyadics[:80],
        "named_irrationals_in_interval": irrationals_named(lo, hi),
        "decimal_samples": decimals,
        "continued_fraction_of_midpoint": continued_fraction(mid),
        "midpoint_as_fraction": str(Fraction(mid).limit_denominator(1000)),
        "cantor_set_illustration_on_unit_interval": cantor_segments,
        "theorems": theorems,
        "certainty": "verified_math",
        "limitations": (
            "The Cantor construction drawn here is an illustration on [0,1], independent of (a,b) unless that interval is the unit interval. "
            "Floating-point zoom is finite; the real line is not."
        ),
        "number_line": samples,
    }
