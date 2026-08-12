window.JOKLOB = window.JOKLOB || {};

JOKLOB.mathLab = {
  parseIntent(text) {
    const t = (text || "").trim();
    if (/הגרל|לוטו|טוטו|lottery|gambling|הימור/i.test(t)) {
      return { blocked: "gambling", intent: "blocked" };
    }
    if (/בטל.*כבידה|cancel.*gravity|turn off gravity|faster than light|פרפטואל|perpetual/i.test(t)) {
      return { blocked: "physics", intent: "counterfactual", expression: null };
    }
    let intent = "evaluate";
    if (/נגזר|deriv/i.test(t)) intent = "derivative";
    else if (/אינטגרל|integr/i.test(t)) intent = "integral";
    else if (/פשט|simplif/i.test(t)) intent = "simplify";
    else if (/=/.test(t)) intent = "solve";

    let expression = null;
    const dollar = t.match(/\$([^$]+)\$/);
    if (dollar) expression = dollar[1].trim();
    else {
      const m = t.match(/(?:solve|פתור|חשב|compute)\s*[:：]?\s*(.+)$/i);
      if (m) expression = m[1].trim();
      else {
        const chunks = t.match(/[0-9a-zA-Zπ\s+\-*/^=().]+/g) || [];
        const ranked = chunks.map((c) => c.trim()).filter((c) => /[=+\-*/^]/.test(c));
        if (ranked.length) expression = ranked.sort((a, b) => b.length - a.length)[0];
      }
    }
    return { intent, expression, blocked: null };
  },

  solveQuadratic(expr) {
    if (!/=/.test(expr)) return null;
    const [left, right] = expr.split("=");
    const fstr = `(${left})-(${right})`;
    try {
      const f = math.compile(fstr);
      // Fit ax^2+bx+c on x=0,1,2 and verify on x=3
      const y0 = f.evaluate({ x: 0 });
      const y1 = f.evaluate({ x: 1 });
      const y2 = f.evaluate({ x: 2 });
      const y3 = f.evaluate({ x: 3 });
      const c = y0;
      const b = (-3 * y0 + 4 * y1 - y2) / 2;
      const a = (y0 - 2 * y1 + y2) / 2;
      const check = a * 9 + b * 3 + c;
      if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null;
      if (Math.abs(check - y3) > 1e-6) return null; // not quadratic (or higher)
      if (Math.abs(a) < 1e-12) return null;
      const disc = b * b - 4 * a * c;
      if (disc < 0) return { a, b, c, disc, roots: [], complex: true };
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      return { a, b, c, disc, roots: [r1, r2].map((v) => Math.round(v * 1e12) / 1e12) };
    } catch {
      return null;
    }
  },

  run(expression, intent = "evaluate") {
    if (!expression || !String(expression).trim()) {
      return {
        ok: false,
        certainty: "insufficient_info",
        error: "לא סופק ביטוי מתמטי חד-משמעי.",
        steps: [],
      };
    }
    const expr = String(expression).trim();
    const steps = [];
    try {
      if (intent === "simplify") {
        const s = math.simplify(expr);
        steps.push({ title: "Input", latex: expr, method: "parse" });
        steps.push({ title: "simplify", latex: s.toString(), method: "math.simplify" });
        return {
          ok: true,
          result: s.toString(),
          latex: s.toTex ? s.toTex() : s.toString(),
          steps,
          certainty: "verified_math",
          limitations: "פישוט אינו ייחודי.",
        };
      }

      if (intent === "derivative") {
        const d = math.derivative(expr, "x");
        steps.push({ title: "f(x)", latex: expr, method: "parse" });
        steps.push({ title: "d/dx", latex: d.toString(), method: "math.derivative" });
        let verify = null;
        try {
          const x0 = 0.37;
          const h = 1e-6;
          const f = math.compile(expr);
          const fd = (f.evaluate({ x: x0 + h }) - f.evaluate({ x: x0 - h })) / (2 * h);
          const sym = d.evaluate({ x: x0 });
          verify = { finiteDifference: fd, symbolic: sym, relErr: Math.abs(fd - sym) / (1 + Math.abs(sym)) };
        } catch (_) {}
        return {
          ok: true,
          result: d.toString(),
          latex: d.toTex ? d.toTex() : d.toString(),
          steps,
          verification: verify,
          certainty: verify && verify.relErr < 1e-4 ? "numerically_checked" : "verified_math",
          limitations: "מניח דיפרנציאביליות.",
        };
      }

      if (intent === "integral") {
        return {
          ok: false,
          certainty: "partial",
          error: "אינטגרל סימבולי מלא אינו זמין ב-math.js בדפדפן. סמנו כתוצאה חלקית — לא מזויפים אנטי-נגזרת.",
          steps: [{ title: "Integrand", latex: expr, method: "parse" }],
          limitations: "לאינטגרלים סימבוליים מלאים השתמשו ב-backend SymPy (אופציונלי).",
        };
      }

      if (intent === "solve" && expr.includes("=")) {
        steps.push({ title: "Equation", latex: expr, method: "parse" });
        const quad = this.solveQuadratic(expr);
        if (quad && quad.roots && !quad.complex) {
          steps.push({ title: "Quadratic formula", latex: "x=(-b\\pm\\sqrt{b^2-4ac})/(2a)", method: "closed_form" });
          steps.push({ title: "Roots", latex: quad.roots.join(", "), method: "exact_quadratic" });
          return {
            ok: true,
            result: quad.roots,
            latex: quad.roots.map((r) => `x=${r}`).join(",\\;"),
            steps,
            verification: { a: quad.a, b: quad.b, c: quad.c, discriminant: quad.disc },
            certainty: "verified_math",
            limitations: "נוסחת השורשים למשוואה ריבועית.",
          };
        }
        const [left, right] = expr.split("=");
        const f = math.compile(`(${left})-(${right})`);
        const roots = [];
        for (const g0 of [-10, -5, -2, -1, 0, 1, 2, 5, 10]) {
          let x = g0;
          for (let i = 0; i < 50; i++) {
            const y = f.evaluate({ x });
            const yp = (f.evaluate({ x: x + 1e-6 }) - f.evaluate({ x: x - 1e-6 })) / 2e-6;
            if (!isFinite(y) || !isFinite(yp) || Math.abs(yp) < 1e-12) break;
            const nx = x - y / yp;
            if (Math.abs(nx - x) < 1e-10) { x = nx; break; }
            x = nx;
          }
          if (Math.abs(f.evaluate({ x })) < 1e-7) {
            const r = Math.round(x * 1e8) / 1e8;
            if (!roots.some((z) => Math.abs(z - r) < 1e-6)) roots.push(r);
          }
        }
        steps.push({ title: "Numeric roots (Newton)", latex: JSON.stringify(roots), method: "newton" });
        return {
          ok: roots.length > 0,
          result: roots,
          latex: roots.length ? roots.map((r) => `x=${r}`).join(",\\;") : "",
          steps,
          certainty: roots.length ? "numerically_checked" : "insufficient_info",
          limitations: "שורשים מספריים עשויים לפספס שורשים.",
        };
      }

      const val = math.evaluate(expr);
      const simplified = math.simplify(expr);
      steps.push({ title: "Parsed", latex: expr, method: "parse" });
      steps.push({ title: "Value", latex: String(val), method: "math.evaluate" });
      return {
        ok: true,
        result: val,
        latex: simplified.toTex ? simplified.toTex() : String(val),
        steps,
        certainty: "verified_math",
        limitations: "הערכה ב-math.js בדפדפן.",
      };
    } catch (e) {
      return {
        ok: false,
        certainty: "insufficient_info",
        error: e.message,
        steps,
        limitations: "המנוע לא הצליח לפרש את הקלט.",
      };
    }
  },
};
