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

    const meanSd = (fn) => {
      const vals = results.map(fn);
      const m = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const v = vals.reduce((s, x) => s + (x - m) ** 2, 0) / (vals.length || 1);
      const sd = Math.sqrt(v);
      const se = sd / Math.sqrt(vals.length || 1);
      return { mean: m, sd, ciLo: m - 1.96 * se, ciHi: m + 1.96 * se };
    };
    const distH = [0, 0, 0, 0, 0, 0, 0];
    const distR = [0, 0, 0, 0, 0, 0, 0];
    results.forEach((row) => {
      row.hybrid.dist.forEach((c, i) => {
        distH[i] += c;
      });
      row.random.dist.forEach((c, i) => {
        distR[i] += c;
      });
    });
    const mid = Math.floor(results.length / 2) || 1;
    const first = results.slice(0, mid);
    const second = results.slice(mid);
    const avgPart = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0) / (arr.length || 1);
    const hybridHit = meanSd((x) => x.hybrid.avgHit);
    const randomHit = meanSd((x) => x.random.avgHit);
    const summary = {
      trials: results.length,
      hybridAvgBest: avg((x) => x.hybrid.best),
      randomAvgBest: avg((x) => x.random.best),
      hybridAvgHit: hybridHit.mean,
      randomAvgHit: randomHit.mean,
      hybridHitCI: [hybridHit.ciLo, hybridHit.ciHi],
      randomHitCI: [randomHit.ciLo, randomHit.ciHi],
      hybridStrongRate: avg((x) => x.hybrid.strongHit / tickets),
      randomStrongRate: avg((x) => x.random.strongHit / tickets),
      hybridDist0to6: distH,
      randomDist0to6: distR,
      stability: {
        hybridFirst: avgPart(first, (x) => x.hybrid.avgHit),
        hybridSecond: avgPart(second, (x) => x.hybrid.avgHit),
        randomFirst: avgPart(first, (x) => x.random.avgHit),
        randomSecond: avgPart(second, (x) => x.random.avgHit),
      },
    };
    const diff = summary.hybridAvgHit - summary.randomAvgHit;
    summary.beatsRandom = diff > 0;
    summary.ciExcludesZero =
      hybridHit.ciLo > randomHit.ciHi || randomHit.ciLo > hybridHit.ciHi;
    summary.overfitSuspicion = results.length < 15 && Math.abs(diff) > 0.35;
    if (!summary.beatsRandom) {
      summary.verdict =
        "במדגם זה המודל לא עלה על אקראיות בממוצע ההתאמות. מוצג בגלוי — אין לטעון לסיכוי משופר.";
    } else if (!summary.ciExcludesZero) {
      summary.verdict =
        "הממוצע גבוה מעט מהבסיס האקראי, אך טווח הביטחון אינו מפריד מובהק. אין הוכחת יתרון להגרלות עתידיות.";
    } else {
      summary.verdict =
        "במדגם זה יש הפרש מול אקראיות, אך זו סימולציה על העבר בלבד — לא הוכחה לעתיד ואין סיכוי משופר מובטח.";
    }
    if (summary.overfitSuspicion) {
      summary.verdict += " חשד להתאמת יתר: מדגם קטן והפרש גדול.";
    }

    return {
      kind: "בדיקת עבר (walk-forward)",
      summary,
      results,
      note: "לא נעשה שימוש בהגרלות עתידיות לחישוב נקודת זמן קודמת.",
    };
  },
};
