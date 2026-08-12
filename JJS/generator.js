window.JOKLOB = window.JOKLOB || {};

JOKLOB.generator = {
  METHODS: {
    pure_random: { he: "אקראי לחלוטין", en: "Pure random" },
    random_calculated: { he: "אקראי־מחושב", en: "Random + calculated" },
    math_balance: { he: "איזון מתמטי", en: "Mathematical balance" },
    multiparam: { he: "ניתוח רב־פרמטרי", en: "Multi-parameter" },
    experimental: { he: "מצב ניסיוני עולמי", en: "Experimental global", experimental: true },
    avoid_human: { he: "הימנעות מבחירות אנושיות נפוצות", en: "Avoid common human picks" },
  },

  uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return JOKLOB.rng.newSeed();
  },

  reasonForNumber(n, stats, scored) {
    const reasons = [];
    if ((stats.hot || []).includes(n)) reasons.push("מופיע בין החמים");
    if ((stats.cold || []).includes(n)) reasons.push("מופיע בין הקרים");
    if ((stats.gaps[n] || 0) >= Math.max(3, Math.floor(stats.totalDraws / 20))) {
      reasons.push(`לא הופיע ${stats.gaps[n]} הגרלות`);
    }
    if (n % 2 === 0) reasons.push("תורם לאיזון זוגי");
    else reasons.push("תורם לאיזון אי־זוגי");
    if (n <= 18) reasons.push("בקבוצת נמוכים");
    else reasons.push("בקבוצת גבוהים");
    if (scored.humanFlags?.length === 0) reasons.push("אינו דפוס אנושי בולט בצירוף");
    return reasons.slice(0, 4);
  },

  candidate(rand, stats, weights, method, experimentalCtx) {
    let nums, strong;
    if (method === "pure_random") {
      nums = JOKLOB.rng.sampleDistinct(1, 37, 6, rand);
      strong = JOKLOB.rng.int(1, 7, rand);
    } else {
      // weighted pool sampling then refine
      const poolScore = [];
      for (let n = 1; n <= 37; n++) {
        let s = rand();
        if (method !== "avoid_human") {
          s += weights.hot * ((stats.freq[n] || 0) / (stats.totalDraws || 1));
          s += weights.cold * (1 / (1 + (stats.freq[n] || 0)));
          s += weights.gap * ((stats.gaps[n] || 0) / (stats.totalDraws || 1));
        }
        if (method === "experimental" && experimentalCtx) {
          const bias = ((experimentalCtx.day * 3 + experimentalCtx.hour) % 37) + 1;
          if (n === bias) s += 0.35 * weights.experimentalGlobal;
        }
        if (method === "avoid_human" && n <= 31) s *= 0.85;
        poolScore.push({ n, s });
      }
      poolScore.sort((a, b) => b.s - a.s);
      // take top band then random pick 6 unique
      const band = poolScore.slice(0, method === "math_balance" ? 22 : 28);
      const picked = [];
      const copy = [...band];
      while (picked.length < 6 && copy.length) {
        const idx = Math.floor(rand() * copy.length);
        picked.push(copy.splice(idx, 1)[0].n);
      }
      nums = picked.sort((a, b) => a - b);
      // ensure uniqueness & fill if needed
      const set = new Set(nums);
      while (set.size < 6) set.add(JOKLOB.rng.int(1, 37, rand));
      nums = [...set].sort((a, b) => a - b).slice(0, 6);

      // local search for balance / multiparam / avoid_human
      const tries = method === "pure_random" ? 0 : method === "random_calculated" ? 40 : 120;
      let best = nums;
      let bestScore = -Infinity;
      for (let t = 0; t < Math.max(1, tries); t++) {
        const trial = t === 0 ? nums : this.mutate(nums, rand);
        const st = JOKLOB.rng.int(1, 7, rand);
        const sc = JOKLOB.metrics.scoreCombo(trial, st, stats, this.effectiveWeights(method, weights), experimentalCtx);
        let adj = sc.score;
        if (method === "math_balance") adj = sc.balanceScore * 2 + sc.score * 0.3;
        if (method === "avoid_human") adj = sc.detail.avoidHumanPatterns * 3 + sc.balanceScore;
        if (adj > bestScore) {
          bestScore = adj;
          best = trial;
          strong = st;
        }
      }
      nums = best;
      if (!strong) strong = JOKLOB.rng.int(1, 7, rand);
    }

    // final uniqueness guarantee
    const uniq = [...new Set(nums)].filter((n) => n >= 1 && n <= 37);
    while (uniq.length < 6) {
      const n = JOKLOB.rng.int(1, 37, rand);
      if (!uniq.includes(n)) uniq.push(n);
    }
    nums = uniq.sort((a, b) => a - b).slice(0, 6);
    strong = Math.min(7, Math.max(1, strong | 0));

    const scored = JOKLOB.metrics.scoreCombo(
      nums,
      strong,
      stats,
      this.effectiveWeights(method, weights),
      experimentalCtx
    );

    const numberReasons = {};
    nums.forEach((n) => {
      numberReasons[n] = this.reasonForNumber(n, stats, scored);
    });

    return { numbers: nums, strong, scored, numberReasons };
  },

  mutate(nums, rand) {
    const arr = [...nums];
    const i = Math.floor(rand() * arr.length);
    let n;
    do {
      n = JOKLOB.rng.int(1, 37, rand);
    } while (arr.includes(n));
    arr[i] = n;
    return arr.sort((a, b) => a - b);
  },

  effectiveWeights(method, weights) {
    const w = { ...weights };
    if (method === "pure_random") {
      Object.keys(w).forEach((k) => { w[k] = 0; });
    }
    if (method === "math_balance") {
      w.hot = w.cold = w.gap = w.pairHistory = 0.05;
      w.experimentalGlobal = 0;
      w.evenOddBalance = w.lowHighBalance = w.sumTarget = w.spacing = w.decadeSpread = 1;
    }
    if (method === "avoid_human") {
      w.avoidHumanPatterns = 1.2;
      w.experimentalGlobal = 0;
    }
    if (method === "experimental") {
      w.experimentalGlobal = Math.max(w.experimentalGlobal, 0.6);
    }
    if (method === "random_calculated") {
      // mix: keep weights but soft
      Object.keys(w).forEach((k) => { w[k] *= 0.65; });
      w.experimentalGlobal = 0;
    }
    return w;
  },

  generate(options) {
    const {
      method = "random_calculated",
      count = 1,
      mode = "regular", // regular | double
      seed = null,
      weights = null,
    } = options || {};

    const useSeed = seed || JOKLOB.rng.newSeed();
    const rand = JOKLOB.rng.fromSeed(useSeed);
    const draws = JOKLOB.history.load();
    const stats = JOKLOB.history.analyze(draws);
    const w = weights || JOKLOB.metrics.loadWeights();
    const now = new Date();
    const experimentalCtx = {
      day: now.getDay(),
      month: now.getMonth() + 1,
      hour: now.getHours(),
      iso: now.toISOString(),
    };

    const ticketsWanted = mode === "double" ? count * 2 : count;
    const tickets = [];
    for (let i = 0; i < ticketsWanted; i++) {
      const c = this.candidate(rand, stats, w, method, experimentalCtx);
      const id = this.uuid();
      tickets.push({
        id,
        calcId: `${useSeed.slice(0, 8)}-${i + 1}-${id.slice(0, 8)}`,
        seed: useSeed,
        index: i + 1,
        board: mode === "double" ? (i % 2) + 1 : 1,
        group: mode === "double" ? Math.floor(i / 2) + 1 : i + 1,
        numbers: c.numbers,
        strong: c.strong,
        method,
        methodLabel: this.METHODS[method]?.he || method,
        experimental: !!this.METHODS[method]?.experimental,
        weightsUsed: this.effectiveWeights(method, w),
        score: c.scored.score,
        balanceScore: c.scored.balanceScore,
        metricsDetail: c.scored.detail,
        numberReasons: c.numberReasons,
        sum: c.scored.sum,
        humanFlags: c.scored.humanFlags,
        dataChecked: {
          draws: stats.totalDraws,
          syntheticShare: stats.syntheticShare,
          avgSum: stats.avgSum,
          hot: stats.hot,
          cold: stats.cold,
          sourceNote: stats.syntheticShare > 0.5 ? JOKLOB.history.DEMO_NOTE : "נתונים שהוזנו על ידי המשתמש",
        },
        createdAt: now.toISOString(),
        disclaimer:
          "בהגרלה הוגנת לכל צירוף חוקי אותה הסתברות. ניתוח היסטוריה אינו מנבא את ההגרלה הבאה ואינו משפר סיכויי זכייה.",
      });
    }

    return {
      seed: useSeed,
      mode,
      method,
      count,
      tickets,
      statsSummary: {
        totalDraws: stats.totalDraws,
        avgSum: stats.avgSum,
        syntheticShare: stats.syntheticShare,
      },
      createdAt: now.toISOString(),
    };
  },

  /** Monte Carlo: estimate distribution of sums under pure random — for report transparency */
  monteCarloSums(n = 2000, seed = "mc-default") {
    const rand = JOKLOB.rng.fromSeed(seed);
    const sums = [];
    for (let i = 0; i < n; i++) {
      const nums = JOKLOB.rng.sampleDistinct(1, 37, 6, rand);
      sums.push(nums.reduce((a, b) => a + b, 0));
    }
    const mean = sums.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    return { n, mean, min, max, note: "סימולציית Monte Carlo על דגימה אחידה — לא תחזית זכייה." };
  },
};
