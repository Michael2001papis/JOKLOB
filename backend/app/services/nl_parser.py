"""Rule-based natural-language parser. Does not invent physics or proofs."""
from __future__ import annotations

import re
from dataclasses import dataclass, field


IMPOSSIBLE_PATTERNS = [
    r"בטל(י|ו)?\s+את\s+כוח\s+הכבידה",
    r"לבטל\s+את\s+הכבידה",
    r"cancel\s+(the\s+)?gravity",
    r"turn\s+off\s+gravity",
    r"מהירות\s+מעל\s+אור",
    r"faster\s+than\s+light",
    r"פרפטואל|perpetual\s+motion",
    r"מכונת\s+תנועה\s+נצחית",
]

GAMBLING_PATTERNS = [
    r"הגרל",
    r"לוטו",
    r"טוטו",
    r"lottery",
    r"jackpot",
    r"הימור",
    r"gambling",
    r"predict\s+the\s+next\s+(lottery|draw)",
]

DOMAIN_KEYWORDS = {
    "calculus": [
        "נגזרת", "אינטגרל", "גבול", "derivative", "integral", "limit",
        "differentiate", "integrate", "d/dx", "∂",
    ],
    "algebra": [
        "משוואה", "equation", "solve", "פתור", "פולינום", "polynomial",
        "factor", "פירוק", "simplify", "פשט",
    ],
    "linear_algebra": [
        "מטריצה", "matrix", "וקטור", "vector", "דטרמיננטה", "eigen",
        "עצמי", "rank", "דרגה",
    ],
    "ode": ["דיפרנציאלית", "ode", "y'", "dy/dx", "משוואה דיפרנציאלית"],
    "pde": ["חלקית", "pde", "laplace", "heat equation", "wave equation", "שרדינגר"],
    "complex": ["מרוכב", "complex", "i^", " holomorph"],
    "number_theory": [
        "ראשוני", "prime", "gcd", "lcm", "מודולו", "modular", "פיבונאצ'י",
        "fibonacci", "פירוק לגורמים",
    ],
    "probability": [
        "הסתברות", "probability", "סטטיסטי", "variance", "שונות",
        "התפלגות", "distribution", "bayes", "בייס",
    ],
    "combinatorics": ["קומבינטור", "permutation", "תמורות", "צירופים", "ncr", "npr"],
    "optimization": ["מינימום", "מקסימום", "optimize", "Lagrange", "אופטימיז"],
    "fourier": ["פורייה", "fourier", "לפלס", "laplace transform"],
    "geometry": ["גאומטר", "geometry", "שטח", "נפח", "triangle", "מעגל"],
    "graph": ["גרף", "graph theory", "vertex", "קודקוד", "קשת"],
    "tensor": ["טנזור", "tensor", "christoffel"],
    "physics_classical": [
        "כבידה", "gravity", "ניוטון", "מהירות", "תאוצה", "כוח", "מסה",
        "newton", "velocity", "acceleration", "force", "mass", "kinematic",
    ],
    "physics_em": ["מגנט", "חשמל", "maxwell", "coulomb", "faraday", "שדה חשמלי"],
    "physics_thermo": ["תרמו", "אנטרופיה", "entropy", "חום", "טמפרטורה", "carnot"],
    "physics_relativity": ["יחסות", "relativ", "מינקובסקי", "schwarzschild", "איינשטיין"],
    "physics_quantum": [
        "קוונט", "quantum", "שרדינגר", "schrodinger", "hilbert", "bra", "ket",
        "הייזנברג", "operator", "אופרטור", "פונקציית גל",
    ],
    "physics_cosmo": ["קוסמו", "cosmo", "האבּל", "hubble", "big bang", " inflat"],
    "units": ["יחידות", "units", "ממדים", "dimensional"],
}


@dataclass
class ParseResult:
    language: str
    domain: str
    intent: str
    expression: str | None
    extracted_numbers: list[float]
    variables: list[dict]
    missing: list[str]
    formal_statement: str
    assumptions: list[str]
    blocked: str | None = None
    certainty_hint: str = "partial"
    notes: list[str] = field(default_factory=list)


def detect_language(text: str) -> str:
    hebrew = len(re.findall(r"[\u0590-\u05FF]", text))
    return "he" if hebrew >= 2 else "en"


def detect_domain(text: str) -> str:
    t = text.lower()
    scores = {k: 0 for k in DOMAIN_KEYWORDS}
    for domain, words in DOMAIN_KEYWORDS.items():
        for w in words:
            if w.lower() in t:
                scores[domain] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] else "algebra"


def extract_expression(text: str) -> str | None:
    # Prefer explicit math between $...$ or after keywords.
    m = re.search(r"\$([^$]+)\$", text)
    if m:
        return m.group(1).strip()
    m = re.search(r"(?:solve|פתור|חשב|compute|evaluate)\s*[:：]?\s*(.+)$", text, re.I)
    if m:
        cand = m.group(1).strip()
        if re.search(r"[0-9xXyYzZ=+\-*/^()]", cand):
            return cand
    # Isolated equation-like chunk
    chunks = re.findall(r"[A-Za-z0-9π∞\s\+\-\*/^=()._{}\\]{3,}", text)
    ranked = [c.strip() for c in chunks if re.search(r"[=+\-*/^]", c) and re.search(r"\d|[a-zA-Z]", c)]
    if ranked:
        return max(ranked, key=len)
    return None


def extract_numbers(text: str) -> list[float]:
    nums = []
    for m in re.finditer(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", text):
        try:
            nums.append(float(m.group()))
        except ValueError:
            pass
    return nums


def parse(text: str) -> ParseResult:
    text = (text or "").strip()
    lang = detect_language(text)
    if not text:
        return ParseResult(
            language=lang,
            domain="unknown",
            intent="empty",
            expression=None,
            extracted_numbers=[],
            variables=[],
            missing=["problem_text"],
            formal_statement="No problem was provided.",
            assumptions=[],
            certainty_hint="insufficient_info",
        )

    for pat in GAMBLING_PATTERNS:
        if re.search(pat, text, re.I):
            return ParseResult(
                language=lang,
                domain="number_theory",
                intent="blocked_gambling",
                expression=None,
                extracted_numbers=extract_numbers(text),
                variables=[],
                missing=[],
                formal_statement=(
                    "הבקשה נראית כניבוי הגרלה/הימור. המעבדה אינה כלי להימורים. "
                    "ניתן לחקור טווחים מספריים כמופשטים בלבד."
                    if lang == "he"
                    else "This looks like lottery/gambling prediction. The lab will not forecast draws. Ranges such as 1–37 may be studied as abstract number sets only."
                ),
                assumptions=[],
                blocked="gambling",
                certainty_hint="contradiction_impossible",
                notes=["No predictive claim is made about random draws."],
            )

    impossible = any(re.search(p, text, re.I) for p in IMPOSSIBLE_PATTERNS)
    domain = detect_domain(text)
    expr = extract_expression(text)
    numbers = extract_numbers(text)

    intent = "solve"
    if re.search(r"נגזר|deriv", text, re.I):
        intent = "differentiate"
    elif re.search(r"אינטגרל|integr", text, re.I):
        intent = "integrate"
    elif re.search(r"פשט|simplif", text, re.I):
        intent = "simplify"
    elif re.search(r"גבול|limit", text, re.I):
        intent = "limit"
    elif re.search(r"מטריצ|matrix|eigen", text, re.I):
        intent = "matrix"
    elif re.search(r"יחידות|units|ממד", text, re.I):
        intent = "units"
    elif re.search(r"בין\s+\d|between\s+\d", text, re.I):
        intent = "between_numbers"
    elif len(numbers) >= 3 and not expr:
        intent = "number_lab"

    variables = []
    missing = []
    assumptions = [
        "The requested computation is interpreted by a rule-based parser, not invented.",
        "Algebraic manipulations are delegated to SymPy.",
        "If the expression is ambiguous, the result is marked partial.",
    ]

    if expr:
        letters = sorted(set(re.findall(r"[a-zA-Z]", expr)))
        for L in letters:
            if L.lower() in {"e", "i", "pi"} and L.lower() != L:
                continue
            if L.lower() in {"sin", "cos", "tan", "log", "ln", "exp"}:
                continue
            variables.append(
                {
                    "name": L,
                    "symbol": L,
                    "value": "",
                    "unit": "",
                    "description": "Unknown symbol extracted from the expression",
                    "confirmed": False,
                }
            )
        # unique by name
        seen = set()
        uniq = []
        for v in variables:
            if v["name"] not in seen and v["name"] not in {"e", "i"}:
                seen.add(v["name"])
                uniq.append(v)
        variables = uniq[:12]
    else:
        missing.append("explicit_expression")

    if impossible:
        assumptions = [
            "General relativity and Newtonian gravity describe gravity as a universal interaction of mass-energy; it cannot be 'switched off' in known physics.",
            "A simulation may set g=0 only as a counterfactual Newtonian model, not as a physical claim.",
            "No experiment in this app cancels gravity.",
        ]
        formal = (
            "בקשה שאינה אפשרית לפי הפיזיקה הידועה: ביטול כוח הכבידה. "
            "ניתן לבנות מודל תיאורטי עם g=0 לצורך סימולציה בלבד, תחת הנחות מפורשות."
            if lang == "he"
            else "Request is not possible under known physics (e.g. cancelling gravity). "
            "A counterfactual Newtonian simulation with g=0 can be run only as a model, with stated assumptions."
        )
        return ParseResult(
            language=lang,
            domain="physics_classical",
            intent="counterfactual_simulation",
            expression=expr,
            extracted_numbers=numbers,
            variables=variables or [
                {"name": "g", "symbol": "g", "value": "0", "unit": "m/s^2", "description": "Counterfactual gravity", "confirmed": False}
            ],
            missing=["initial_conditions", "masses_and_positions"],
            formal_statement=formal,
            assumptions=assumptions,
            certainty_hint="contradiction_impossible",
            notes=["Any follow-up computation is a theoretical model, not a physical prediction."],
        )

    if intent == "number_lab":
        formal = (
            f"נתח את הסדרה המספרית {numbers} בכלים של תורת המספרים, סטטיסטיקה וחיפוש תבניות, בלי ניבוי הימורים."
            if lang == "he"
            else f"Analyze the numeric sequence {numbers} with number theory, statistics, and pattern search. No lottery prediction."
        )
    elif expr:
        intent_he = {
            "differentiate": "חשב את הנגזרת של",
            "integrate": "חשב את האינטגרל של",
            "simplify": "פשט את הביטוי",
            "limit": "חשב את הגבול של",
            "matrix": "נתח את המטריצה/הביטוי",
            "units": "בדוק יחידות עבור",
            "solve": "פתור את הבעיה",
        }
        if lang == "he":
            formal = f"{intent_he.get(intent, 'פתור')}: {expr}"
        else:
            formal = f"{intent} the expression: {expr}"
    else:
        formal = (
            "הטקסט התקבל אך לא חולץ ביטוי מתמטי חד-משמעי. נדרש ניסוח מפורש או משתנים."
            if lang == "he"
            else "Text was received but no unambiguous mathematical expression was extracted."
        )
        missing.append("well_posed_expression")

    if domain.startswith("physics") and not numbers:
        missing.append("numeric_initial_conditions")

    return ParseResult(
        language=lang,
        domain=domain,
        intent=intent,
        expression=expr,
        extracted_numbers=numbers,
        variables=variables,
        missing=missing,
        formal_statement=formal,
        assumptions=assumptions,
        certainty_hint="partial" if missing else "numerically_checked",
    )


def as_dict(p: ParseResult) -> dict:
    return {
        "language": p.language,
        "domain": p.domain,
        "intent": p.intent,
        "expression": p.expression,
        "extracted_numbers": p.extracted_numbers,
        "variables": p.variables,
        "missing": p.missing,
        "formal_statement": p.formal_statement,
        "assumptions": p.assumptions,
        "blocked": p.blocked,
        "certainty_hint": p.certainty_hint,
        "notes": p.notes,
    }
