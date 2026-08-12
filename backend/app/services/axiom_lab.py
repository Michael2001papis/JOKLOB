"""Experimental axiom systems. Finite inference only — not a claim of completeness."""
from __future__ import annotations

import itertools
import re
from typing import Any


BINARY_OPS = {
    "+": lambda a, b: a + b,
    "*": lambda a, b: a * b,
    "max": lambda a, b: max(a, b),
    "min": lambda a, b: min(a, b),
    "xor": lambda a, b: (a + b) % 2 if isinstance(a, int) and isinstance(b, int) else None,
}


def _parse_axiom(text: str) -> dict:
    t = text.strip()
    kind = "raw"
    if re.search(r"commutat|חילופ", t, re.I):
        kind = "commutative"
    elif re.search(r"associat|קיבוצ", t, re.I):
        kind = "associative"
    elif re.search(r"identity|נייטרל|יחידה", t, re.I):
        kind = "identity"
    elif re.search(r"inverse|הופכי", t, re.I):
        kind = "inverse"
    elif re.search(r"distribut|פילוג", t, re.I):
        kind = "distributive"
    elif re.search(r"no.?zero|ללא אפס|integral", t, re.I):
        kind = "no_zero_divisors"
    return {"text": t, "kind": kind}


def analyze_world(definition: dict) -> dict:
    objects = definition.get("objects") or []
    symbols = definition.get("symbols") or []
    axioms_in = definition.get("axioms") or []
    operations = definition.get("operations") or ["+"]
    constraints = definition.get("constraints") or []

    universe = []
    for item in objects:
        try:
            universe.append(int(item))
        except Exception:
            universe.append(str(item))
    if not universe:
        universe = [0, 1]

    parsed_axioms = [_parse_axiom(a) if isinstance(a, str) else a for a in axioms_in]
    op_name = operations[0] if operations else "+"
    op = BINARY_OPS.get(op_name)
    theorems = []
    contradictions = []
    examples = []
    counterexamples = []
    comparable = []

    if op is None:
        return {
            "ok": False,
            "certainty": "insufficient_info",
            "error": f"Operation '{op_name}' is not among the finite built-in operators {list(BINARY_OPS)}.",
            "note": "This is a finite experimental checker, not a general automated theorem prover.",
        }

    # Build Cayley table when universe is small and numeric
    numeric = all(isinstance(x, int) for x in universe)
    table = {}
    closed = True
    if numeric:
        for a, b in itertools.product(universe, repeat=2):
            val = op(a, b)
            table[f"{a}{op_name}{b}"] = val
            if val not in universe:
                closed = False
    else:
        closed = False
        theorems.append(
            {
                "statement": "Non-integer objects: only syntactic recording is performed.",
                "certainty": "partial",
            }
        )

    kinds = {a["kind"] for a in parsed_axioms}

    if numeric and "commutative" in kinds:
        fails = []
        for a, b in itertools.product(universe, repeat=2):
            if op(a, b) != op(b, a):
                fails.append((a, b, op(a, b), op(b, a)))
                break
        if fails:
            contradictions.append({"axiom": "commutative", "counterexample": fails[0], "certainty": "verified_math"})
        else:
            theorems.append({"statement": f"({op_name}) is commutative on the finite universe {universe}.", "certainty": "verified_math"})

    if numeric and "associative" in kinds:
        fails = []
        for a, b, c in itertools.product(universe, repeat=3):
            if op(op(a, b), c) != op(a, op(b, c)):
                fails.append((a, b, c))
                break
        if fails:
            contradictions.append({"axiom": "associative", "counterexample": fails[0], "certainty": "verified_math"})
        else:
            theorems.append({"statement": f"({op_name}) is associative on {universe}.", "certainty": "verified_math"})

    identity = None
    if numeric and "identity" in kinds:
        for e in universe:
            if all(op(e, a) == a and op(a, e) == a for a in universe):
                identity = e
                break
        if identity is None:
            contradictions.append({"axiom": "identity", "note": "No identity element in the universe.", "certainty": "verified_math"})
        else:
            theorems.append({"statement": f"Identity element e={identity}.", "certainty": "verified_math"})

    if numeric and "inverse" in kinds:
        e = identity if identity is not None else 0
        missing = []
        for a in universe:
            if not any(op(a, b) == e and op(b, a) == e for b in universe):
                missing.append(a)
        if missing:
            contradictions.append({"axiom": "inverse", "elements_without_inverse": missing, "certainty": "verified_math"})
        else:
            theorems.append({"statement": f"Every element has an inverse relative to e={e}.", "certainty": "verified_math"})

    if not closed and numeric:
        contradictions.append(
            {
                "axiom": "closure",
                "note": "Operation is not closed in the declared object set. This is a genuine obstruction to calling the set a magma under the operation.",
                "certainty": "verified_math",
            }
        )
    elif numeric and closed:
        theorems.append({"statement": "The operation is closed on the declared universe (finite magma).", "certainty": "verified_math"})

    # Compare to known structures
    if numeric and closed:
        n = len(universe)
        if op_name == "+" and set(universe) == set(range(n)) and all(op(a, b) == (a + b) % n for a, b in itertools.product(universe, repeat=2)):
            comparable.append("cyclic_group_Z_n additive")
        if op_name == "+" and set(universe) <= set(range(0, 20)) and closed and "commutative" in kinds:
            comparable.append("possibly a finite commutative magma; isomorphism not uniquely determined")

    examples.append({"cayley_sample": dict(list(table.items())[:16])})

    if constraints:
        theorems.append(
            {
                "statement": "User constraints were recorded but not independently certified unless they match a checked algebraic identity.",
                "constraints": constraints,
                "certainty": "partial",
            }
        )

    certainty = "contradiction_impossible" if contradictions else ("verified_math" if numeric else "partial")
    return {
        "ok": True,
        "universe": universe,
        "operation": op_name,
        "closed": closed,
        "parsed_axioms": parsed_axioms,
        "theorems": theorems,
        "contradictions": contradictions,
        "examples": examples,
        "counterexamples": counterexamples,
        "comparable_structures": comparable,
        "certainty": certainty,
        "limitations": (
            "Inference is exhaustive only on a finite declared universe with a built-in operation. "
            "This is not 'mathematics without rules'; it is a new rule-set that we check for finite consistency. "
            "No completeness theorem for first-order logic is claimed."
        ),
        "disclaimer": "Proof vs conjecture vs experiment is labelled per item.",
    }
