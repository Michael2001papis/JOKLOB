"""Scientific certainty labels. Never present a guess as a theorem."""

LABELS = {
    "verified_math": {
        "he": "תוצאה מאומתת מתמטית",
        "en": "Mathematically verified",
        "tag": "verified",
    },
    "numerically_checked": {
        "he": "תוצאה שנבדקה מספרית",
        "en": "Numerically checked",
        "tag": "numeric",
    },
    "unproven_conjecture": {
        "he": "השערה שעדיין לא הוכחה",
        "en": "Unproven conjecture",
        "tag": "conjecture",
    },
    "theoretical_model": {
        "he": "מודל תיאורטי המבוסס על הנחות",
        "en": "Theoretical model under assumptions",
        "tag": "model",
    },
    "partial": {
        "he": "תוצאה חלקית",
        "en": "Partial result",
        "tag": "partial",
    },
    "insufficient_info": {
        "he": "בעיה שאין עבורה מספיק מידע",
        "en": "Insufficient information",
        "tag": "unknown",
    },
    "contradiction_impossible": {
        "he": "סתירה או תוצאה שאינה אפשרית",
        "en": "Contradiction or physically impossible",
        "tag": "impossible",
    },
}


def pack(code: str) -> dict:
    meta = LABELS.get(code, LABELS["partial"])
    return {"code": code, **meta}
