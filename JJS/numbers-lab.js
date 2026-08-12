window.JOKLOB = window.JOKLOB || {};

JOKLOB.numbersLab = {
  factor(n) {
    n = Math.trunc(n);
    if (!Number.isFinite(n)) return { n, note: "לא מספר שלם" };
    const sign = n < 0 ? -1 : 1;
    let a = Math.abs(n);
    if (a <= 1) return { n, factors: { [n]: 1 } };
    const fac = {};
    for (let p = 2; p * p <= a; p++) {
      while (a % p === 0) {
        fac[p] = (fac[p] || 0) + 1;
        a /= p;
      }
    }
    if (a > 1) fac[a] = (fac[a] || 0) + 1;
    if (sign < 0) fac["-1"] = 1;
    return { n, factors: fac };
  },

  analyze(numbers) {
    const xs = numbers.map(Number).filter((x) => Number.isFinite(x));
    if (!xs.length) {
      return { ok: false, certainty: "insufficient_info", error: "הזינו לפחות מספר אחד." };
    }
    const n = xs.length;
    const mean = xs.reduce((a, b) => a + b, 0) / n;
    const sorted = [...xs].sort((a, b) => a - b);
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const variance = n > 1 ? xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1) : 0;
    const diffs = xs.slice(1).map((x, i) => x - xs[i]);
    const ratios = xs.slice(1).map((x, i) => (xs[i] === 0 ? null : x / xs[i]));
    const explanations = [];

    if (diffs.length && diffs.every((d) => Math.abs(d - diffs[0]) < 1e-9)) {
      explanations.push({
        kind: "arithmetic_progression",
        formula: `a_n = ${xs[0]} + ${diffs[0]}(n-1)`,
        certainty: "verified_math",
      });
    }
    const goodRatios = ratios.filter((r) => r != null);
    if (goodRatios.length >= 2 && goodRatios.every((r) => Math.abs(r - goodRatios[0]) < 1e-9)) {
      explanations.push({
        kind: "geometric_progression",
        formula: `a_n = ${xs[0]} * (${goodRatios[0]})^(n-1)`,
        certainty: "verified_math",
      });
    }
    // fibonacci check
    if (n >= 4 && xs.every((x) => Number.isInteger(x))) {
      let fib = true;
      for (let i = 2; i < n; i++) if (xs[i] !== xs[i - 1] + xs[i - 2]) fib = false;
      if (fib) explanations.push({ kind: "fibonacci_like", certainty: "numerically_checked" });
    }
    if (!explanations.length) {
      explanations.push({
        kind: "no_unique_rule",
        note: "אין כלל ייחודי לרשימה סופית. פולינום ממעלה n-1 תמיד מתאים — זו התאמת יתר, לא גילוי.",
        certainty: "insufficient_info",
      });
    }

    return {
      ok: true,
      numbers: xs,
      statistics: {
        count: n,
        mean,
        median,
        variance,
        std: Math.sqrt(variance),
        min: Math.min(...xs),
        max: Math.max(...xs),
      },
      differences: diffs,
      ratios,
      factorization: xs.map((x) => this.factor(x)),
      explanations,
      nextTermPolicy: {
        allowed: false,
        reason: "אין ניבוי מספר הבא להגרלות/אקראי. רשימה סופית אינה קובעת חוק יחיד.",
      },
      certainty: explanations.some((e) => e.certainty === "verified_math") ? "verified_math" : "numerically_checked",
      limitations: "ניתוח על המדגם בלבד. אין כלי הימורים.",
    };
  },

  combine(xs, method) {
    const a = xs.map(Number);
    const methods = {
      sum: a.reduce((s, x) => s + x, 0),
      product: a.reduce((s, x) => s * x, 1),
      mean: a.reduce((s, x) => s + x, 0) / a.length,
      rms: Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length),
    };
    return {
      method,
      value: methods[method],
      all: methods,
      certainty: "verified_math",
      note: "המיפוי מ-k מספרים למספר אחד אינו הפיך באופן יחיד.",
    };
  },

  explode(value, k, lo = 1, hi = 37) {
    k = Math.max(2, Math.min(12, k | 0));
    const solutions = [];
    const eq = Array(k).fill(value / k);
    solutions.push({ rule: "equal_real_parts", tuple: eq.map((x) => Math.round(x * 1e6) / 1e6) });
    solutions.push({ rule: "inject_first", tuple: [value, ...Array(k - 1).fill(0)] });
    return {
      solutions,
      certainty: "partial",
      warning: "אין הופכי יחיד. אלה דוגמאות תחת אילוצים — לא «המספרים הסודיים».",
      bounds: { min: lo, max: hi },
    };
  },
};
