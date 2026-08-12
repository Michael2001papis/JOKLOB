window.JOKLOB = window.JOKLOB || {};

JOKLOB.physicsLab = {
  scenarios: [
    { id: "projectile", he: "קליע / מכניקה קלאסית", en: "Projectile" },
    { id: "oscillator", he: "מתנד הרמוני", en: "Harmonic oscillator" },
    { id: "newton", he: "כוח ניוטון (עם/בלי g)", en: "Newtonian force" },
    { id: "dilation", he: "התארכות זמן (יחסות פרטית)", en: "SR time dilation" },
    { id: "well", he: "חלקיק בבור אינסופי", en: "Particle in a box" },
  ],

  run(id, params) {
    const p = params || {};
    if (id === "projectile") {
      const v0 = Number(p.v0 ?? 20);
      const ang = Number(p.angle_deg ?? 45) * Math.PI / 180;
      const g = Number(p.g ?? 9.80665);
      const y0 = Number(p.y0 ?? 0);
      const vx = v0 * Math.cos(ang);
      const vy = v0 * Math.sin(ang);
      const tEnd = g === 0 ? 5 : Math.max(0.1, (vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * y0))) / g);
      const t = [], x = [], y = [];
      for (let i = 0; i < 200; i++) {
        const ti = (tEnd * i) / 199;
        t.push(ti);
        x.push(vx * ti);
        y.push(y0 + vy * ti - 0.5 * g * ti * ti);
      }
      return {
        ok: true,
        assumptions: [
          "שדה כבידה אחיד, בלי התנגדות אוויר.",
          g === 0 ? "g=0 הוא מודל תיאורטי נגדי — לא ביטול כבידה בטבע." : "מסגרת אינרציאלית שטוחה.",
        ],
        equations: ["x(t)=v_0\\cos\\theta\\, t", "y(t)=y_0+v_0\\sin\\theta\\, t-\\tfrac12 g t^2"],
        series: { t, x, y },
        certainty: g === 0 ? "theoretical_model" : "numerically_checked",
        warning: g === 0 ? "לא ניתן לבטל כבידה בפיזיקה הידועה. זו סימולציה בלבד." : null,
        limitations: "בלי גרר, קוריוליס או יחסות כללית.",
      };
    }
    if (id === "oscillator") {
      const m = Number(p.m ?? 1);
      const k = Number(p.k ?? 4);
      const x0 = Number(p.x0 ?? 1);
      const v0 = Number(p.v0 ?? 0);
      const w = Math.sqrt(k / m);
      const A = x0, B = w ? v0 / w : 0;
      const t = [], x = [], energy = [];
      for (let i = 0; i < 300; i++) {
        const ti = (10 * i) / 299;
        const xi = A * Math.cos(w * ti) + B * Math.sin(w * ti);
        const vi = -A * w * Math.sin(w * ti) + B * w * Math.cos(w * ti);
        t.push(ti); x.push(xi);
        energy.push(0.5 * m * vi * vi + 0.5 * k * xi * xi);
      }
      return {
        ok: true,
        assumptions: ["חוק הוק F=-kx", "בלי ריסון"],
        equations: ["m\\ddot x=-kx", "\\omega=\\sqrt{k/m}"],
        series: { t, x, energy },
        certainty: "verified_math",
        limitations: "קפיץ ליניארי הוא קירוב.",
      };
    }
    if (id === "newton") {
      const Gphys = 6.6743e-11;
      const cancel = !!p.cancel_gravity;
      const G = cancel ? 0 : Gphys;
      const m1 = Number(p.m1 ?? 5.972e24);
      const m2 = Number(p.m2 ?? 7.348e22);
      const r = Number(p.r ?? 3.84e8);
      const F = r ? (G * m1 * m2) / (r * r) : 0;
      return {
        ok: true,
        assumptions: ["מסות נקודתיות בניוטון", cancel ? "G=0 סימולציה נגדית בלבד" : "פעולה מיידית (לא GR)"],
        equations: ["F=G m_1 m_2 / r^2"],
        force_N: F,
        certainty: cancel ? "theoretical_model" : "numerically_checked",
        warning: cancel ? "כבידה אינה ניתנת לביטול בפיזיקה הידועה." : null,
        limitations: "בלי יחסות כללית.",
      };
    }
    if (id === "dilation") {
      const v = Number(p.v ?? 0.6);
      if (Math.abs(v) >= 1) {
        return {
          ok: false,
          certainty: "contradiction_impossible",
          error: "חלקיק מסיבי אינו יכול לנוע ב-|v|≥c ביחסות פרטית.",
          assumptions: ["מרחב מינקובסקי"],
        };
      }
      const gamma = 1 / Math.sqrt(1 - v * v);
      const vs = [], gs = [];
      for (let i = 0; i < 80; i++) {
        const vi = (0.99 * i) / 79;
        vs.push(vi);
        gs.push(1 / Math.sqrt(1 - vi * vi));
      }
      return {
        ok: true,
        assumptions: ["יחסות פרטית, מסגרות אינרציאליות", "v ביחידות c"],
        equations: ["\\gamma=(1-v^2/c^2)^{-1/2}"],
        gamma,
        series: { v: vs, gamma: gs },
        certainty: "verified_math",
        limitations: "קינמטיקה של SR בלבד — לא טענה על FTL.",
      };
    }
    if (id === "well") {
      const n = Math.max(1, Number(p.n ?? 1) | 0);
      const L = Number(p.L ?? 1);
      const x = [], psi = [], rho = [];
      for (let i = 0; i < 300; i++) {
        const xi = (L * i) / 299;
        const yi = Math.sqrt(2 / L) * Math.sin((n * Math.PI * xi) / L);
        x.push(xi); psi.push(yi); rho.push(yi * yi);
      }
      const E = (n * n * Math.PI * Math.PI) / (2 * L * L); // hbar=m=1
      return {
        ok: true,
        assumptions: ["בור ריבועי אינסופי 1D", "יחידות טבעיות ℏ=m=1"],
        equations: ["\\psi_n=\\sqrt{2/L}\\sin(n\\pi x/L)", "E_n=n^2\\pi^2\\hbar^2/(2mL^2)"],
        series: { x, psi, rho },
        energy: E,
        certainty: "verified_math",
        limitations: "קירות אינסופיים הם אידיאליזציה.",
      };
    }
    return { ok: false, certainty: "insufficient_info", error: "תרחיש לא ידוע" };
  },
};
