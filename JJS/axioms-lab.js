window.JOKLOB = window.JOKLOB || {};

JOKLOB.axiomsLab = {
  analyze(definition) {
    const objects = (definition.objects || []).map((x) => {
      const n = Number(x);
      return Number.isFinite(n) && String(x).trim() !== "" ? n : String(x);
    });
    const universe = objects.length ? objects : [0, 1];
    const opName = (definition.operations && definition.operations[0]) || "+";
    const axioms = (definition.axioms || []).map((a) => String(a).toLowerCase());
    const numeric = universe.every((x) => typeof x === "number" && Number.isInteger(x));

    const ops = {
      "+": (a, b) => a + b,
      "*": (a, b) => a * b,
      max: (a, b) => Math.max(a, b),
      min: (a, b) => Math.min(a, b),
      xor: (a, b) => (a + b) % 2,
    };
    const op = ops[opName];
    if (!op || !numeric) {
      return {
        ok: false,
        certainty: "insufficient_info",
        error: "בדיקה סופית רק ליקום מספרים שלמים ולפעולות: + * max min xor",
        limitations: "זה בודק עולם עם חוקים מוגדרים — לא «מתמטיקה בלי חוקים».",
      };
    }

    const theorems = [];
    const contradictions = [];
    let closed = true;
    for (const a of universe) for (const b of universe) {
      if (!universe.includes(op(a, b))) closed = false;
    }
    if (closed) theorems.push({ statement: `הפעולה ${opName} סגורה על ${JSON.stringify(universe)}.`, certainty: "verified_math" });
    else contradictions.push({ axiom: "closure", note: "אין סגירות — לא מאגמה על הקבוצה שהוגדרה.", certainty: "verified_math" });

    if (axioms.some((a) => a.includes("commutat") || a.includes("חילופ"))) {
      let ok = true;
      for (const a of universe) for (const b of universe) if (op(a, b) !== op(b, a)) ok = false;
      (ok ? theorems : contradictions).push({
        axiom: "commutative",
        statement: ok ? "חילופית על היקום הסופי." : "לא חילופית.",
        certainty: "verified_math",
      });
    }
    if (axioms.some((a) => a.includes("associat") || a.includes("קיבוצ"))) {
      let ok = true;
      outer: for (const a of universe) for (const b of universe) for (const c of universe) {
        if (op(op(a, b), c) !== op(a, op(b, c))) { ok = false; break outer; }
      }
      (ok ? theorems : contradictions).push({
        axiom: "associative",
        statement: ok ? "קיבוצית על היקום הסופי." : "לא קיבוצית.",
        certainty: "verified_math",
      });
    }

    return {
      ok: true,
      universe,
      operation: opName,
      closed,
      theorems,
      contradictions,
      certainty: contradictions.length ? "contradiction_impossible" : "verified_math",
      limitations: "בדיקה ממצה רק על יקום סופי שהוגדר. אין טענת שלמות ללוגיקה מסדר ראשון.",
      disclaimer: "עולם מתמטי עם חוקים חדשים ומוגדרים.",
    };
  },
};
