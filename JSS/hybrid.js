window.JOKLOB = window.JOKLOB || {};

/**
 * המודל ההיברידי של מיכאל
 * 2 אש + 2 לחץ + 1 קר + 1 חם + חזק נפרד + אקראיות משוקללת
 */
JOKLOB.hybrid = {
  buildPool(draws, count, seed, opts = {}) {
    const rand = JOKLOB.rng.fromSeed(seed);
    const report = JOKLOB.analyze.fullReport(draws);
    const fire = report.fire.list.map((x) => x.n);
    const pressure = report.pressure.list.map((x) => x.n);
    const hot = report.classes.hot;
    const cold = report.classes.cold;
    const shadow = report.shadow;
    const pairs = report.pairs.pairs.slice(0, 40).map((p) => p.key.split("-").map(Number));
    const scoreW = { ...JOKLOB.analyze.scoreWeightsDefault, ...(opts.scoreWeights || {}) };
    if (opts.experimentalMode === "weighted") {
      scoreW.experimental = Math.min(0.1, opts.experimentalWeight ?? 0.08);
    } else {
      scoreW.experimental = 0;
    }

    const candidates = [];
    const targetSumLo = shadow.p25 ?? 97;
    const targetSumHi = shadow.p75 ?? 131;
    const attempts = Math.max(800, count * 400);

    for (let a = 0; a < attempts; a++) {
      const tags = {};
      const pick = (arr, tag) => {
        for (let t = 0; t < 12; t++) {
          const n = arr[Math.floor(rand() * Math.min(arr.length, 14))];
          if (n && !tags[n]) {
            tags[n] = tags[n] || [];
            tags[n].push(tag);
            return n;
          }
        }
        // fallback
        let n;
        do {
          n = JOKLOB.rng.int(1, 37, rand);
        } while (tags[n]);
        tags[n] = [tag, "מילוי"];
        return n;
      };

      pick(fire, "אש");
      pick(fire, "אש");
      pick(pressure, "לחץ");
      pick(pressure, "לחץ");
      pick(cold, "קר היסטורי");
      pick(hot, "חם היסטורי");

      // if overlap left us short, fill
      let nums = Object.keys(tags).map(Number);
      while (nums.length < 6) {
        const n = JOKLOB.rng.int(1, 37, rand);
        if (!tags[n]) {
          tags[n] = ["השלמה אקראית"];
          nums.push(n);
        }
      }
      nums = [...new Set(nums)].sort((a, b) => a - b).slice(0, 6);
      while (nums.length < 6) {
        const n = JOKLOB.rng.int(1, 37, rand);
        if (!nums.includes(n)) {
          nums.push(n);
          tags[n] = ["השלמה אקראית"];
        }
        nums.sort((a, b) => a - b);
      }

      // optional historical pair injection (~35%)
      if (rand() < 0.35 && pairs.length) {
        const pr = pairs[Math.floor(rand() * pairs.length)];
        const rest = nums.filter((n) => n !== pr[0] && n !== pr[1]);
        while (rest.length > 4) rest.pop();
        const set = new Set([pr[0], pr[1], ...rest]);
        while (set.size < 6) set.add(JOKLOB.rng.int(1, 37, rand));
        nums = [...set].sort((a, b) => a - b);
        tags[pr[0]] = [...new Set([...(tags[pr[0]] || []), "זוג היסטורי"])];
        tags[pr[1]] = [...new Set([...(tags[pr[1]] || []), "זוג היסטורי"])];
      }

      const sig = JOKLOB.analyze.shadowSignature(nums);
      // soft structure preferences — not hard reject except illegal already handled
      if (sig.maxRun >= 4) continue;

      const scoreParts = this.scoreParts(nums, sig, report, shadow, scoreW, opts.experimentalCtx, rand);
      const total =
        scoreParts.shadow * scoreW.shadow +
        scoreParts.firePressure * scoreW.firePressure +
        scoreParts.hotCold * scoreW.hotCold +
        scoreParts.spread * scoreW.spread +
        scoreParts.evenOdd * scoreW.evenOdd +
        scoreParts.pairs * scoreW.pairs +
        scoreParts.sequences * scoreW.sequences +
        scoreParts.diversity * scoreW.diversity +
        scoreParts.random * scoreW.random +
        scoreParts.experimental * scoreW.experimental;

      candidates.push({
        numbers: nums,
        tags,
        signature: sig,
        score: total,
        scoreParts,
        scoreWeights: scoreW,
        inSumBand: sig.sum >= targetSumLo && sig.sum <= targetSumHi,
      });
    }

    // rank and weighted-random among top band
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, Math.max(30, Math.min(120, Math.floor(candidates.length * 0.12))));
    const picked = [];
    const used = new Set();
    for (let i = 0; i < count; i++) {
      const weights = top.map((c) => Math.pow(Math.max(0.01, c.score), 2));
      let choice = JOKLOB.rng.pickWeighted(top, weights, rand);
      // diversity nudge
      let guard = 0;
      while (used.has(choice.numbers.join("-")) && guard++ < 20) {
        choice = JOKLOB.rng.pickWeighted(top, weights, rand);
      }
      used.add(choice.numbers.join("-"));

      const strongEngine = this.pickStrong(report.strong, rand);
      picked.push({
        ...choice,
        strong: strongEngine.strong,
        strongMeta: strongEngine,
        model: "המודל ההיברידי של מיכאל",
        modelId: "michael_hybrid",
        kind: "התאמה למודל המחקרי + אקראיות משוקללת",
      });
    }

    return {
      picked,
      poolSize: candidates.length,
      topSize: top.length,
      reportSummary: {
        sampleSize: report.sampleSize,
        shadowMean: shadow.mean,
        sumBand: [targetSumLo, targetSumHi],
      },
      fireTop: report.classes.fireTop,
      pressureTop: report.classes.pressureTop,
      hot: report.classes.hot.slice(0, 10),
      cold: report.classes.cold.slice(0, 10),
    };
  },

  scoreParts(nums, sig, report, shadow, scoreW, experimentalCtx, rand) {
    const fireSet = new Set(report.classes.fireTop.slice(0, 12));
    const pressSet = new Set(report.classes.pressureTop.slice(0, 12));
    const hotSet = new Set(report.classes.hot.slice(0, 12));
    const coldSet = new Set(report.classes.cold.slice(0, 12));
    const fireN = nums.filter((n) => fireSet.has(n)).length;
    const pressN = nums.filter((n) => pressSet.has(n)).length;
    const hotN = nums.filter((n) => hotSet.has(n)).length;
    const coldN = nums.filter((n) => coldSet.has(n)).length;

    const sumCenter = shadow.median || shadow.mean || 114;
    const sumFit = Math.exp(-Math.abs(sig.sum - sumCenter) / 28);
    const evenFit = 1 - Math.abs(sig.evenOdd[0] - 3) / 3;
    const spreadFit = 1 - Math.abs(new Set(sig.bands.filter(Boolean)).size - 3) / 3;
    // density-aware: prefer not overloading 31-37 beyond 2
    const lastBandPen = sig.bands[3] > 2 ? 0.7 : 1;
    const pairKeys = new Set(report.pairs.pairs.slice(0, 30).map((p) => p.key));
    let pairHits = 0;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (pairKeys.has(`${nums[i]}-${nums[j]}`)) pairHits++;
      }
    }
    const seqPen = sig.maxRun >= 3 ? 0.6 : sig.maxRun === 2 ? 0.95 : 1;
    let experimental = 0.5;
    if (experimentalCtx) {
      const bias = ((experimentalCtx.day * 5 + experimentalCtx.hour) % 37) + 1;
      experimental = nums.includes(bias) ? 0.75 : 0.4;
    }

    return {
      shadow: sumFit * lastBandPen,
      firePressure: Math.min(1, (fireN + pressN) / 4),
      hotCold: Math.min(1, (hotN + coldN) / 4),
      spread: spreadFit,
      evenOdd: evenFit,
      pairs: Math.min(1, pairHits / 2),
      sequences: seqPen,
      diversity: 0.5 + rand() * 0.5,
      random: rand(),
      experimental,
      counts: { fireN, pressN, hotN, coldN, pairHits },
    };
  },

  pickStrong(strongReport, rand) {
    const list = strongReport.list || [];
    const weights = list.map((x) => 0.35 * x.fire + 0.25 * x.pressure + 0.4 * (x.rate * 100) + 5);
    const choice = JOKLOB.rng.pickWeighted(list, weights, rand);
    return {
      strong: choice.strong,
      reason: "מנוע חזק נפרד — שכיחות/אש/לחץ על 1–7",
      meta: choice,
    };
  },
};
