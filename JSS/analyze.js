/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

JOKLOB.analyze = {
  fireWeightsDefault: { recent: 0.4, historic: 0.3, trend: 0.2, stability: 0.1 },
  scoreWeightsDefault: {
    shadow: 0.22,
    firePressure: 0.2,
    hotCold: 0.12,
    spread: 0.12,
    evenOdd: 0.1,
    pairs: 0.08,
    sequences: 0.06,
    diversity: 0.05,
    random: 0.05,
    experimental: 0,
  },

  loadFireWeights() {
    try {
      return { ...this.fireWeightsDefault, ...JSON.parse(localStorage.getItem("joklob_fire_w") || "{}") };
    } catch {
      return { ...this.fireWeightsDefault };
    }
  },
  saveFireWeights(w) {
    localStorage.setItem("joklob_fire_w", JSON.stringify(w));
  },

  expectedRate() {
    // 6 numbers drawn from 37 each draw
    return 6 / 37;
  },

  windowDraws(draws, n) {
    return draws.slice(Math.max(0, draws.length - n));
  },

  frequencyTable(draws) {
    const N = draws.length || 1;
    const exp = this.expectedRate();
    const freq = Array(38).fill(0);
    const appearances = Array.from({ length: 38 }, () => []);
    draws.forEach((d, idx) => {
      d.numbers.forEach((n) => {
        if (n >= 1 && n <= 37) {
          freq[n]++;
          appearances[n].push(idx);
        }
      });
    });

    const rows = [];
    for (let n = 1; n <= 37; n++) {
      const count = freq[n];
      const rate = count / N;
      const expected = exp * N;
      const deviation = count - expected;
      const gaps = [];
      const apps = appearances[n];
      for (let i = 1; i < apps.length; i++) gaps.push(apps[i] - apps[i - 1]);
      const lastIdx = apps.length ? apps[apps.length - 1] : -1;
      const since = lastIdx < 0 ? N : N - 1 - lastIdx;
      const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : N;
      const maxGap = gaps.length ? Math.max(...gaps) : N;
      const minGap = gaps.length ? Math.min(...gaps) : N;
      rows.push({
        n,
        count,
        rate,
        expected,
        deviation,
        since,
        avgGap,
        maxGap,
        minGap,
      });
    }

    const byHist = [...rows].sort((a, b) => b.count - a.count || a.n - b.n);
    byHist.forEach((r, i) => { r.rankHistoric = i + 1; });

    const sinceSorted = [...rows].map((r) => r.since).sort((a, b) => a - b);
    rows.forEach((r) => {
      const idx = sinceSorted.indexOf(r.since);
      r.quietPercentile = sinceSorted.length ? (idx / (sinceSorted.length - 1 || 1)) * 100 : 0;
    });

    return { N, rows, byHist };
  },

  compareWindows(draws) {
    const full = this.frequencyTable(draws);
    const recent = this.frequencyTable(this.windowDraws(draws, Math.min(100, draws.length)));
    const mid = this.frequencyTable(this.windowDraws(draws, Math.min(250, draws.length)));
    const mapRecent = Object.fromEntries(recent.rows.map((r) => [r.n, r]));
    const mapMid = Object.fromEntries(mid.rows.map((r) => [r.n, r]));

    const enriched = full.rows.map((r) => {
      const rec = mapRecent[r.n];
      const m = mapMid[r.n];
      const trend = (rec.rate || 0) - (r.rate || 0);
      const midTrend = (rec.rate || 0) - (m.rate || 0);
      const stability = 1 - Math.min(1, Math.abs(trend) * 20);
      return {
        ...r,
        recentRate: rec.rate,
        recentCount: rec.count,
        recentSince: rec.since,
        rankRecent: recent.byHist.findIndex((x) => x.n === r.n) + 1,
        trend,
        midTrend,
        stability,
        strengthening: trend > 0.01,
        weakening: trend < -0.01,
      };
    });

    enriched.sort((a, b) => a.rankHistoric - b.rankHistoric);
    return { full, recent, mid, enriched, sampleSize: draws.length, recentSize: recent.N };
  },

  fireIndex(draws, weights) {
    const w = weights || this.loadFireWeights();
    const cmp = this.compareWindows(draws);
    const scores = cmp.enriched.map((r) => {
      const recent = Math.min(1, (r.recentRate || 0) / (this.expectedRate() * 2));
      const historic = Math.min(1, (r.rate || 0) / (this.expectedRate() * 2));
      const trend = Math.max(0, Math.min(1, 0.5 + r.trend * 25));
      const stability = r.stability;
      const score =
        100 *
        (w.recent * recent + w.historic * historic + w.trend * trend + w.stability * stability);
      return {
        n: r.n,
        score: Math.round(score * 10) / 10,
        parts: { recent, historic, trend, stability },
        meta: r,
      };
    });
    scores.sort((a, b) => b.score - a.score);
    return { weights: w, list: scores, context: { sampleSize: cmp.sampleSize, recentSize: cmp.recentSize } };
  },

  pressureIndex(draws) {
    const cmp = this.compareWindows(draws);
    const list = cmp.enriched.map((r) => {
      const quiet = Math.min(1, r.quietPercentile / 100);
      const hist = Math.min(1, (r.rate || 0) / (this.expectedRate() * 2));
      const drop = Math.max(0, Math.min(1, (r.rate - r.recentRate) * 30));
      const gapVsAvg = Math.min(1, r.since / Math.max(1, r.avgGap));
      const score = 100 * (0.35 * quiet + 0.25 * hist + 0.25 * drop + 0.15 * Math.min(1, gapVsAvg));
      return {
        n: r.n,
        score: Math.round(score * 10) / 10,
        since: r.since,
        quietPercentile: r.quietPercentile,
        histRate: r.rate,
        recentRate: r.recentRate,
        avgGap: r.avgGap,
      };
    });
    list.sort((a, b) => b.score - a.score);
    return {
      list,
      warning:
        "לחץ סטטיסטי אינו אומר שהמספר חייב להופיע. הגרלה אקראית אינה חייבת לפצות על היעדרויות קודמות.",
      context: { sampleSize: cmp.sampleSize },
    };
  },

  pairsAndTriples(draws) {
    const pairCount = new Map();
    const tripleCount = new Map();
    const pairLast = new Map();
    const tripleLast = new Map();
    draws.forEach((d, idx) => {
      const nums = [...d.numbers].sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const k = `${nums[i]}-${nums[j]}`;
          pairCount.set(k, (pairCount.get(k) || 0) + 1);
          pairLast.set(k, d.date || idx);
          for (let t = j + 1; t < nums.length; t++) {
            const tk = `${nums[i]}-${nums[j]}-${nums[t]}`;
            tripleCount.set(tk, (tripleCount.get(tk) || 0) + 1);
            tripleLast.set(tk, d.date || idx);
          }
        }
      }
    });
    const N = draws.length || 1;
    // expected rough: C(6,2)/C(37,2) per draw for pairs
    const expPair = (15 / 666) * N;
    const expTriple = (20 / 7770) * N;
    const pairs = [...pairCount.entries()]
      .map(([k, c]) => ({
        key: k,
        count: c,
        last: pairLast.get(k),
        expected: expPair,
        ratio: c / (expPair || 1),
      }))
      .sort((a, b) => b.count - a.count);
    const triples = [...tripleCount.entries()]
      .map(([k, c]) => ({
        key: k,
        count: c,
        last: tripleLast.get(k),
        expected: expTriple,
        ratio: c / (expTriple || 1),
      }))
      .sort((a, b) => b.count - a.count);
    return {
      pairs,
      triples,
      note: "יחס גבוה עשוי לנבוע גם מריבוי בדיקות מקריות. אין קביעה שהקשר יימשך.",
      multipleTestingWarning: true,
    };
  },

  sequences(draws) {
    const seqCount = new Map();
    let none = 0, two = 0, threePlus = 0;
    draws.forEach((d) => {
      const nums = [...d.numbers].sort((a, b) => a - b);
      const runs = [];
      let run = [nums[0]];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i - 1] + 1) run.push(nums[i]);
        else {
          if (run.length >= 2) runs.push(run);
          run = [nums[i]];
        }
      }
      if (run.length >= 2) runs.push(run);
      if (!runs.length) none++;
      else if (runs.some((r) => r.length >= 3)) threePlus++;
      else two++;
      runs.forEach((r) => {
        if (r.length === 2) {
          const k = `${r[0]}-${r[1]}`;
          seqCount.set(k, (seqCount.get(k) || 0) + 1);
        }
      });
    });
    const top = [...seqCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    return {
      none,
      two,
      threePlus,
      top,
      note: "רצף קצר אינו נדיר — אין לפסול אוטומטית שישייה עם רצף.",
    };
  },

  shadowSignature(numbers) {
    const nums = [...numbers].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / 6;
    const median = (nums[2] + nums[3]) / 2;
    const range = nums[5] - nums[0];
    const variance = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / 6;
    const std = Math.sqrt(variance);
    const gaps = [];
    for (let i = 1; i < 6; i++) gaps.push(nums[i] - nums[i - 1]);
    const evens = nums.filter((n) => n % 2 === 0).length;
    const odds = 6 - evens;
    const bands = [0, 0, 0, 0]; // 1-10,11-20,21-30,31-37
    nums.forEach((n) => {
      if (n <= 10) bands[0]++;
      else if (n <= 20) bands[1]++;
      else if (n <= 30) bands[2]++;
      else bands[3]++;
    });
    // normalized band density (last band has 7 numbers)
    const bandDensity = [
      bands[0] / 10,
      bands[1] / 10,
      bands[2] / 10,
      bands[3] / 7,
    ];
    let maxRun = 1, run = 1, runCount = 0;
    for (let i = 1; i < 6; i++) {
      if (nums[i] === nums[i - 1] + 1) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else {
        if (run >= 2) runCount++;
        run = 1;
      }
    }
    if (run >= 2) runCount++;
    const endings = {};
    nums.forEach((n) => {
      const e = n % 10;
      endings[e] = (endings[e] || 0) + 1;
    });
    const repeatedEndings = Object.values(endings).filter((c) => c > 1).length;
    return {
      numbers: nums,
      sum,
      mean,
      median,
      range,
      std,
      gaps,
      evenOdd: [evens, odds],
      bands,
      bandDensity,
      bandPattern: bands.join("-"),
      maxRun,
      runCount,
      repeatedEndings,
    };
  },

  shadowStats(draws) {
    const sigs = draws.map((d) => this.shadowSignature(d.numbers));
    const sums = sigs.map((s) => s.sum).sort((a, b) => a - b);
    const q = (p) => sums[Math.floor((sums.length - 1) * p)] || 114;
    const mean = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
    const median = q(0.5);
    const evenOddMap = {};
    const bandMap = {};
    let bandTotals = [0, 0, 0, 0];
    sigs.forEach((s) => {
      const eo = s.evenOdd.join(":");
      evenOddMap[eo] = (evenOddMap[eo] || 0) + 1;
      bandMap[s.bandPattern] = (bandMap[s.bandPattern] || 0) + 1;
      s.bands.forEach((c, i) => {
        bandTotals[i] += c;
      });
    });
    const evenOddTop = Object.entries(evenOddMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, c]) => ({ pattern: k, count: c, rate: c / (sigs.length || 1) }));
    const bandTop = Object.entries(bandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, c]) => ({ pattern: k, count: c, rate: c / (sigs.length || 1) }));
    const N = sigs.length || 1;
    return {
      mean,
      median,
      p10: q(0.1),
      p25: q(0.25),
      p75: q(0.75),
      p90: q(0.9),
      researchRef: JOKLOB.snapshot.shadowRef,
      note: "טווח 31–37 מכיל 7 מספרים בלבד — אין להשוות ספירה גולמית לטווחים של 10.",
      sampleSize: draws.length,
      evenOddTop,
      bandTop,
      bandAvg: bandTotals.map((t) => +(t / N).toFixed(3)),
      bandDensityAvg: [
        +(bandTotals[0] / N / 10).toFixed(4),
        +(bandTotals[1] / N / 10).toFixed(4),
        +(bandTotals[2] / N / 10).toFixed(4),
        +(bandTotals[3] / N / 7).toFixed(4),
      ],
    };
  },

  strongAnalysis(draws) {
    const freq = Array(8).fill(0);
    const last = Array(8).fill(-1);
    draws.forEach((d, idx) => {
      const s = d.strong;
      if (s >= 1 && s <= 7) {
        freq[s]++;
        last[s] = idx;
      }
    });
    const N = draws.length || 1;
    const recent = this.windowDraws(draws, Math.min(100, N));
    const freqR = Array(8).fill(0);
    recent.forEach((d) => {
      if (d.strong >= 1 && d.strong <= 7) freqR[d.strong]++;
    });
    const list = [];
    for (let s = 1; s <= 7; s++) {
      const rate = freq[s] / N;
      const recentRate = freqR[s] / (recent.length || 1);
      const since = last[s] < 0 ? N : N - 1 - last[s];
      const fire = 100 * (0.5 * Math.min(1, recentRate * 7) + 0.3 * Math.min(1, rate * 7) + 0.2 * Math.max(0, recentRate - rate + 0.5));
      const pressure = 100 * (0.5 * Math.min(1, since / 20) + 0.5 * Math.min(1, rate * 7));
      list.push({
        strong: s,
        count: freq[s],
        rate,
        recentRate,
        since,
        fire: Math.round(fire * 10) / 10,
        pressure: Math.round(pressure * 10) / 10,
      });
    }
    list.sort((a, b) => b.count - a.count);
    return {
      list,
      snapshotStrong: JOKLOB.snapshot.strongHistoric,
      note: "צילום המצב המקורי מציג 3,5,6 כבולטים — הדירוג הפעיל מחושב מהמאגר העדכני.",
    };
  },

  classifyNumbers(draws) {
    const cmp = this.compareWindows(draws);
    const fire = this.fireIndex(draws).list;
    const pressure = this.pressureIndex(draws).list;
    const hot = cmp.enriched.slice().sort((a, b) => b.recentRate - a.recentRate).slice(0, 15).map((r) => r.n);
    const cold = cmp.enriched.slice().sort((a, b) => a.rate - b.rate).slice(0, 15).map((r) => r.n);
    const quiet = cmp.enriched.slice().sort((a, b) => b.since - a.since).slice(0, 12).map((r) => r.n);
    return {
      hot,
      cold,
      quiet,
      fireTop: fire.slice(0, 12).map((x) => x.n),
      pressureTop: pressure.slice(0, 12).map((x) => x.n),
      cmp,
      fire,
      pressure,
    };
  },

  fullReport(draws) {
    const filtered = draws.filter((d) => d.numbers.every((n) => n >= 1 && n <= 37));
    return {
      kind: "חישוב מתמטי על נתונים היסטוריים",
      sampleSize: filtered.length,
      frequency: this.frequencyTable(filtered),
      windows: this.compareWindows(filtered),
      fire: this.fireIndex(filtered),
      pressure: this.pressureIndex(filtered),
      pairs: this.pairsAndTriples(filtered),
      sequences: this.sequences(filtered),
      shadow: this.shadowStats(filtered),
      strong: this.strongAnalysis(filtered),
      classes: this.classifyNumbers(filtered),
      snapshot: JOKLOB.snapshot,
    };
  },
};
