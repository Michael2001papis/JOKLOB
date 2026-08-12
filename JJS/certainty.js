window.JOKLOB = window.JOKLOB || {};

JOKLOB.certainty = {
  labels: {
    verified_math: { he: "תוצאה מאומתת מתמטית", en: "Mathematically verified", tag: "verified" },
    numerically_checked: { he: "תוצאה שנבדקה מספרית", en: "Numerically checked", tag: "numeric" },
    unproven_conjecture: { he: "השערה שעדיין לא הוכחה", en: "Unproven conjecture", tag: "conjecture" },
    theoretical_model: { he: "מודל תיאורטי המבוסס על הנחות", en: "Theoretical model", tag: "model" },
    partial: { he: "תוצאה חלקית", en: "Partial result", tag: "partial" },
    insufficient_info: { he: "בעיה שאין עבורה מספיק מידע", en: "Insufficient information", tag: "unknown" },
    contradiction_impossible: { he: "סתירה או תוצאה שאינה אפשרית", en: "Contradiction / impossible", tag: "impossible" },
  },
  pack(code) {
    const meta = this.labels[code] || this.labels.partial;
    return { code, ...meta };
  },
  html(code) {
    const c = this.pack(code);
    const label = JOKLOB.i18n.lang === "en" ? c.en : c.he;
    return `<span class="tag ${c.tag}">${label}</span>`;
  },
};
