window.JOKLOB = window.JOKLOB || {};

/**
 * Historical draws store.
 * Demo data is synthetic (seeded) for analysis UI — labelled clearly.
 * Users can paste real CSV: n1,n2,n3,n4,n5,n6,strong
 */
JOKLOB.history = {
  DEMO_NOTE: "מאגר הדגמה סינתטי לניתוח. החליפו בנתוני הגרלות אמיתיים במסך «נתונים».",

  load() {
    try {
      const raw = localStorage.getItem("joklob_draws");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return this.makeDemo(180);
  },

  save(draws) {
    localStorage.setItem("joklob_draws", JSON.stringify(draws));
  },

  makeDemo(n) {
    const rand = JOKLOB.rng.fromSeed("joklob-demo-history-v1");
    const draws = [];
    for (let i = 0; i < n; i++) {
      draws.push({
        id: i + 1,
        numbers: JOKLOB.rng.sampleDistinct(1, 37, 6, rand),
        strong: JOKLOB.rng.int(1, 7, rand),
        synthetic: true,
      });
    }
    return draws;
  },

  parseCsv(text) {
    const rows = [];
    for (const line of String(text).split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || /[a-zA-Zא-ת]/.test(t)) continue;
      const parts = t.split(/[\s,;|]+/).map(Number).filter((x) => Number.isFinite(x));
      if (parts.length < 7) continue;
      const nums = [...new Set(parts.slice(0, 6))].filter((x) => x >= 1 && x <= 37);
      const strong = parts[6];
      if (nums.length === 6 && strong >= 1 && strong <= 7) {
        rows.push({ numbers: nums.sort((a, b) => a - b), strong, synthetic: false });
      }
    }
    return rows;
  },

  analyze(draws) {
    const freq = Array(38).fill(0);
    const strongFreq = Array(8).fill(0);
    const lastSeen = Array(38).fill(-1);
    const pairCount = new Map();
    let evenOdd = { even: 0, odd: 0 };
    let lowHigh = { low: 0, high: 0 };
    const sums = [];
    let consecutivePairs = 0;
    const endings = Array(10).fill(0);
    let repeatFromPrev = 0;

    draws.forEach((d, idx) => {
      const nums = d.numbers;
      sums.push(nums.reduce((a, b) => a + b, 0));
      strongFreq[d.strong]++;
      for (const n of nums) {
        freq[n]++;
        lastSeen[n] = idx;
        endings[n % 10]++;
        if (n % 2 === 0) evenOdd.even++; else evenOdd.odd++;
        if (n <= 18) lowHigh.low++; else lowHigh.high++;
      }
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          pairCount.set(key, (pairCount.get(key) || 0) + 1);
        }
        if (i > 0 && nums[i] === nums[i - 1] + 1) consecutivePairs++;
      }
      if (idx > 0) {
        const prev = new Set(draws[idx - 1].numbers);
        repeatFromPrev += nums.filter((x) => prev.has(x)).length;
      }
    });

    const totalDraws = draws.length || 1;
    const gaps = [];
    for (let n = 1; n <= 37; n++) {
      gaps[n] = lastSeen[n] < 0 ? totalDraws : totalDraws - 1 - lastSeen[n];
    }
    const avgSum = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
    const hot = [...Array(37)].map((_, i) => i + 1).sort((a, b) => freq[b] - freq[a]).slice(0, 10);
    const cold = [...Array(37)].map((_, i) => i + 1).sort((a, b) => freq[a] - freq[b]).slice(0, 10);
    const topPairs = [...pairCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

    return {
      totalDraws,
      freq,
      strongFreq,
      gaps,
      hot,
      cold,
      evenOdd,
      lowHigh,
      avgSum,
      consecutivePairs,
      endings,
      repeatFromPrevAvg: repeatFromPrev / Math.max(1, totalDraws - 1),
      topPairs,
      syntheticShare: draws.filter((d) => d.synthetic).length / totalDraws,
    };
  },
};
