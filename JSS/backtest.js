/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

/**
 * Walk-forward backtest vs pure random — no future leakage.
 */
JOKLOB.backtest = {
  run(draws, { startIndex = 80, step = 5, tickets = 3, horizon = 40 } = {}) {
    const fmt = draws.filter((d) => d.numbers.every((n) => n >= 1 && n <= 37));
    const results = [];
    let i = Math.max(startIndex, 50);
    let guard = 0;
    while (i < fmt.length - 1 && results.length < horizon) {
      const past = fmt.slice(0, i);
      const actual = fmt[i];
      const seed = `bt-${i}-${past.length}`;
      const hybrid = JOKLOB.hybrid.buildPool(past, tickets, seed);
      const randomTickets = [];
      const rand = JOKLOB.rng.fromSeed(`rnd-${seed}`);
      for (let t = 0; t < tickets; t++) {
        randomTickets.push({
          numbers: JOKLOB.rng.sampleDistinct(1, 37, 6, rand),
          strong: JOKLOB.rng.int(1, 7, rand),
        });
      }

      const scoreSet = (ticketsArr) => {
        let best = 0;
        let strongHit = 0;
        const dist = [0, 0, 0, 0, 0, 0, 0];
        ticketsArr.forEach((t) => {
          const hit = t.numbers.filter((n) => actual.numbers.includes(n)).length;
          best = Math.max(best, hit);
          dist[hit]++;
          if (t.strong === actual.strong) strongHit++;
        });
        return { best, strongHit, dist, avgHit: ticketsArr.reduce((s, t) => s + t.numbers.filter((n) => actual.numbers.includes(n)).length, 0) / ticketsArr.length };
      };

      const h = scoreSet(hybrid.picked);
      const r = scoreSet(randomTickets);
      results.push({
        index: i,
        date: actual.date,
        drawNumber: actual.drawNumber,
        actual: actual.numbers,
        actualStrong: actual.strong,
        hybrid: h,
        random: r,
        pastSize: past.length,
      });
      i += step;
      guard++;
      if (guard > 500) break;
    }

    const avg = (keyPath) => {
      const vals = results.map((row) => keyPath(row));
      return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    };

    const summary = {
      trials: results.length,
      hybridAvgBest: avg((x) => x.hybrid.best),
      randomAvgBest: avg((x) => x.random.best),
      hybridAvgHit: avg((x) => x.hybrid.avgHit),
      randomAvgHit: avg((x) => x.random.avgHit),
      hybridStrongRate: avg((x) => x.hybrid.strongHit / tickets),
      randomStrongRate: avg((x) => x.random.strongHit / tickets),
    };
    summary.beatsRandom = summary.hybridAvgHit > summary.randomAvgHit;
    summary.verdict = summary.beatsRandom
      ? "במדגם זה המודל ההיברידי מציג ממוצע התאמות גבוה מעט מהבסיס האקראי — אין זו הוכחת יתרון מובהק להגרלות עתידיות."
      : "במדגם זה המודל לא עלה על אקראיות בממוצע ההתאמות. מוצג בגלוי — אין לטעון לסיכוי משופר.";

    return {
      kind: "בדיקת עבר (walk-forward)",
      summary,
      results,
      note: "לא נעשה שימוש בהגרלות עתידיות לחישוב נקודת זמן קודמת.",
    };
  },
};
