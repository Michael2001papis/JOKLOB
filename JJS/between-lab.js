window.JOKLOB = window.JOKLOB || {};

JOKLOB.betweenLab = {
  farey(n) {
    let a = 0, b = 1, c = 1, d = n;
    const out = ["0/1"];
    while (c <= n) {
      const k = Math.floor((n + b) / d);
      const na = c, nb = d, nc = k * c - a, nd = k * d - b;
      a = na; b = nb; c = nc; d = nd;
      out.push(`${a}/${b}`);
      if (a === 1 && b === 1) break;
    }
    return out;
  },

  explore(a, b, zoom = 1) {
    a = Number(a); b = Number(b);
    if (!(a < b) && !(b < a)) {
      return { ok: false, certainty: "contradiction_impossible", error: "המרווח הפתוח (a,a) ריק." };
    }
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const mid = (lo + hi) / 2;
    const viewW = (hi - lo) / Math.max(zoom, 1);
    let vlo = mid - viewW / 2, vhi = mid + viewW / 2;
    vlo = Math.max(vlo, lo); vhi = Math.min(vhi, hi);
    const rationals = [];
    for (const item of this.farey(24)) {
      const [p, q] = item.split("/").map(Number);
      const val = p / q;
      if (val > vlo && val < vhi) rationals.push({ frac: item, value: val });
    }
    const named = [
      ["sqrt(2)", Math.SQRT2],
      ["golden", (1 + Math.sqrt(5)) / 2],
      ["e", Math.E],
      ["pi", Math.PI],
      ["ln2", Math.LN2],
    ].filter(([, v]) => v > lo && v < hi).map(([name, value]) => ({ name, value, certainty: "verified_math" }));

    return {
      ok: true,
      interval: { a: lo, b: hi },
      view: { left: vlo, right: vhi, zoom, mid },
      rationals: rationals.slice(0, 60),
      namedIrrationals: named,
      theorems: [
        { title: "צפיפות הרציונליים", statement: "בין כל שני ממשיים יש רציונלי (למעשה אינסוף).", certainty: "verified_math" },
        { title: "צפיפות האי-רציונליים", statement: "בין כל שני ממשיים יש אי-רציונלי.", certainty: "verified_math" },
        { title: "אין עוקב מיידי", statement: "אין «המספר הבא» אחרי ממשי. זו משפט על R — לא תהליך פיזיקלי.", certainty: "verified_math" },
      ],
      certainty: "verified_math",
      limitations: "הזום צף וסופי; קו הישרים הממשיים אינו.",
    };
  },
};
