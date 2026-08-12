/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

JOKLOB.generator = {
  METHODS: {
    michael_hybrid: { he: "המודל ההיברידי של מיכאל", research: true },
    pure_random: { he: "אקראי לחלוטין" },
    random_calculated: { he: "אקראי־מחושב" },
    math_balance: { he: "איזון / צל הגרלה" },
    experimental: { he: "שכבה ניסיונית עולמית", experimental: true },
  },

  getDraws(period = "format37") {
    const db = JOKLOB.data.load();
    return {
      db,
      draws: JOKLOB.data.filterPeriod(db.draws, period),
    };
  },

  generate(opts = {}) {
    const method = opts.method || "michael_hybrid";
    const count = Math.max(1, Math.min(20, opts.count || 1));
    const mode = opts.mode || "regular";
    const period = opts.period || "format37";
    const seed = opts.seed || JOKLOB.rng.newSeed();
    const { db, draws } = this.getDraws(period);
    const now = new Date();
    const experimentalCtx = {
      day: now.getDay(),
      month: now.getMonth() + 1,
      hour: now.getHours(),
      mode: opts.experimentalMode || "seed_only",
    };

    const ticketsNeeded = mode === "double" ? count * 2 : count;
    let tickets = [];

    if (method === "michael_hybrid") {
      const built = JOKLOB.hybrid.buildPool(draws, ticketsNeeded, seed, {
        experimentalMode: opts.experimentalMode,
        experimentalWeight: opts.experimentalWeight,
        experimentalCtx: opts.experimentalMode === "weighted" ? experimentalCtx : null,
      });
      tickets = built.picked.map((p, i) => this.packTicket(p, {
        i,
        seed,
        method,
        mode,
        count,
        db,
        draws,
        built,
        experimentalCtx,
        experimentalMode: opts.experimentalMode || "seed_only",
      }));
    } else {
      const rand = JOKLOB.rng.fromSeed(seed);
      const report = JOKLOB.analyze.fullReport(draws);
      for (let i = 0; i < ticketsNeeded; i++) {
        let nums = JOKLOB.rng.sampleDistinct(1, 37, 6, rand);
        if (method !== "pure_random") {
          const shadow = report.shadow;
          let best = nums;
          let bestScore = -1;
          for (let t = 0; t < 80; t++) {
            const trial = JOKLOB.rng.sampleDistinct(1, 37, 6, rand);
            const sig = JOKLOB.analyze.shadowSignature(trial);
            const sumFit = Math.exp(-Math.abs(sig.sum - (shadow.median || 114)) / 30);
            const eo = 1 - Math.abs(sig.evenOdd[0] - 3) / 3;
            const sc = sumFit * 0.6 + eo * 0.4 + rand() * 0.15;
            if (sc > bestScore) {
              bestScore = sc;
              best = trial;
            }
          }
          nums = best;
        }
        const strong = JOKLOB.rng.int(1, 7, rand);
        const sig = JOKLOB.analyze.shadowSignature(nums);
        tickets.push(
          this.packTicket(
            {
              numbers: nums,
              strong,
              tags: Object.fromEntries(nums.map((n) => [n, [method === "pure_random" ? "אקראי" : "איזון/מחושב"]])),
              signature: sig,
              score: bestScoreSafe(sig, report),
              scoreParts: { random: 1 },
              scoreWeights: {},
              model: JOKLOB.generator.METHODS[method].he,
              modelId: method,
              kind: method === "pure_random" ? "תוצאה אקראית" : "התאמה למודל + אקראיות",
              strongMeta: { reason: "בחירה אקראית/מאוזנת במנוע חזק פשוט" },
            },
            { i, seed, method, mode, count, db, draws, built: { reportSummary: { sampleSize: draws.length } }, experimentalCtx, experimentalMode: opts.experimentalMode }
          )
        );
      }
    }

    return {
      seed,
      method,
      mode,
      count,
      period,
      tickets,
      dataVersion: {
        source: db.sourceLabel,
        updatedAt: db.updatedAt,
        drawsUsed: draws.length,
        isDemo: !!db.isDemo,
      },
      createdAt: now.toISOString(),
      snapshotName: JOKLOB.snapshot.name,
    };

    function bestScoreSafe(sig, report) {
      const m = report.shadow.median || 114;
      return Math.exp(-Math.abs(sig.sum - m) / 30);
    }
  },

  packTicket(p, ctx) {
    const { i, seed, method, mode, db, draws, built, experimentalCtx, experimentalMode } = ctx;
    const id = crypto.randomUUID ? crypto.randomUUID() : JOKLOB.rng.newSeed();
    const fire = (built.fireTop || []).filter((n) => p.numbers.includes(n));
    const pressure = (built.pressureTop || []).filter((n) => p.numbers.includes(n));
    const hot = (built.hot || []).filter((n) => p.numbers.includes(n));
    const cold = (built.cold || []).filter((n) => p.numbers.includes(n));
    return {
      id,
      calcId: `${seed.slice(0, 8)}-${i + 1}-${id.slice(0, 8)}`,
      seed,
      index: i + 1,
      board: mode === "double" ? (i % 2) + 1 : 1,
      group: mode === "double" ? Math.floor(i / 2) + 1 : i + 1,
      numbers: p.numbers,
      strong: p.strong,
      method,
      methodLabel: p.model || JOKLOB.generator.METHODS[method]?.he,
      modelId: p.modelId || method,
      kind: p.kind,
      researchScore: p.score,
      scoreParts: p.scoreParts,
      scoreWeights: p.scoreWeights,
      tags: p.tags,
      signature: p.signature,
      firePicked: fire,
      pressurePicked: pressure,
      hotPicked: hot,
      coldPicked: cold,
      strongMeta: p.strongMeta,
      dataVersion: {
        source: db.sourceLabel,
        updatedAt: db.updatedAt,
        drawsUsed: draws.length,
        isDemo: !!db.isDemo,
      },
      experimentalMode,
      experimentalCtx,
      randomShare: (p.scoreWeights && p.scoreWeights.random) || 0.05,
      createdAt: new Date().toISOString(),
      disclaimer:
        "ציון התאמה למודל המחקרי — לא סיכוי זכייה. לכל צירוף חוקי אותה הסתברות בסיסית בהגרלה הוגנת.",
    };
  },
};
