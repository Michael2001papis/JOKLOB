window.JOKLOB = window.JOKLOB || {};

JOKLOB.metrics = {
  defaults: {
    hot: 0.35,
    cold: 0.15,
    gap: 0.25,
    evenOddBalance: 0.55,
    lowHighBalance: 0.55,
    sumTarget: 0.5,
    spacing: 0.45,
    avoidConsecutive: 0.35,
    decadeSpread: 0.5,
    endingDiversity: 0.3,
    pairHistory: 0.2,
    avoidHumanPatterns: 0.7,
    experimentalGlobal: 0,
  },

  labels: {
    hot: "מספרים חמים (תדירות)",
    cold: "מספרים קרים",
    gap: "פער מאז הופעה אחרונה",
    evenOddBalance: "איזון זוגי/אי־זוגי",
    lowHighBalance: "איזון נמוך/גבוה",
    sumTarget: "סכום קרוב לממוצע היסטורי",
    spacing: "פיזור מרווחים",
    avoidConsecutive: "הפחתת עוקבים",
    decadeSpread: "פיזור בעשיריות",
    endingDiversity: "גיוון ספרות סופיות",
    pairHistory: "זוגות שהופיעו יחד",
    avoidHumanPatterns: "הימנעות מדפוסים אנושיים",
    experimentalGlobal: "מודל ניסיוני עולמי",
  },

  loadWeights() {
    try {
      const w = JSON.parse(localStorage.getItem("joklob_weights") || "null");
      return { ...this.defaults, ...(w || {}) };
    } catch {
      return { ...this.defaults };
    }
  },

  saveWeights(w) {
    localStorage.setItem("joklob_weights", JSON.stringify(w));
  },

  isHumanish(nums) {
    const reasons = [];
    // birthdays-ish: many <=31
    if (nums.filter((n) => n <= 31).length >= 5) reasons.push("רוב המספרים ≤31 (דפוס ימי הולדת)");
    // long run
    let run = 1, maxRun = 1;
    for (let i = 1; i < nums.length; i++) {
      run = nums[i] === nums[i - 1] + 1 ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
    if (maxRun >= 3) reasons.push("רצף של 3+ עוקבים");
    // round-ish
    if (nums.filter((n) => n % 5 === 0).length >= 3) reasons.push("ריבוי כפולות של 5");
    // arithmetic progression of length 4+
    const diffs = new Set();
    for (let i = 1; i < nums.length; i++) diffs.add(nums[i] - nums[i - 1]);
    if (diffs.size === 1) reasons.push("סדרה חשבונית מלאה");
    // clustered decades
    const decades = [0, 0, 0, 0];
    nums.forEach((n) => {
      if (n <= 9) decades[0]++;
      else if (n <= 19) decades[1]++;
      else if (n <= 29) decades[2]++;
      else decades[3]++;
    });
    if (Math.max(...decades) >= 4) reasons.push("ריכוז בעשירייה אחת");
    return reasons;
  },

  scoreCombo(nums, strong, stats, weights, experimentalCtx) {
    const w = weights;
    const detail = {};
    let score = 0;

    const hotScore = nums.reduce((s, n) => s + (stats.freq[n] || 0), 0) / (stats.totalDraws * 6 || 1);
    detail.hot = hotScore;
    score += w.hot * hotScore;

    const coldScore = nums.reduce((s, n) => s + (1 / (1 + (stats.freq[n] || 0))), 0) / 6;
    detail.cold = coldScore;
    score += w.cold * coldScore;

    const gapScore = nums.reduce((s, n) => s + (stats.gaps[n] || 0), 0) / (stats.totalDraws * 6 || 1);
    detail.gap = gapScore;
    score += w.gap * gapScore;

    const evens = nums.filter((n) => n % 2 === 0).length;
    const eo = 1 - Math.abs(evens - 3) / 3;
    detail.evenOddBalance = eo;
    score += w.evenOddBalance * eo;

    const lows = nums.filter((n) => n <= 18).length;
    const lh = 1 - Math.abs(lows - 3) / 3;
    detail.lowHighBalance = lh;
    score += w.lowHighBalance * lh;

    const sum = nums.reduce((a, b) => a + b, 0);
    const target = stats.avgSum || 114;
    const sumScore = Math.exp(-Math.abs(sum - target) / 40);
    detail.sumTarget = sumScore;
    score += w.sumTarget * sumScore;

    const gaps = [];
    for (let i = 1; i < nums.length; i++) gaps.push(nums[i] - nums[i - 1]);
    const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const varGap = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / gaps.length;
    const spacing = Math.min(1, Math.sqrt(varGap) / 8);
    detail.spacing = spacing;
    score += w.spacing * spacing;

    const consec = gaps.filter((g) => g === 1).length;
    const avoidC = 1 - consec / 5;
    detail.avoidConsecutive = avoidC;
    score += w.avoidConsecutive * avoidC;

    const dec = [0, 0, 0, 0];
    nums.forEach((n) => {
      if (n <= 9) dec[0]++;
      else if (n <= 19) dec[1]++;
      else if (n <= 29) dec[2]++;
      else dec[3]++;
    });
    const filled = dec.filter((x) => x > 0).length / 4;
    detail.decadeSpread = filled;
    score += w.decadeSpread * filled;

    const ends = new Set(nums.map((n) => n % 10));
    const endDiv = ends.size / 6;
    detail.endingDiversity = endDiv;
    score += w.endingDiversity * endDiv;

    let pairHits = 0;
    const top = new Set((stats.topPairs || []).slice(0, 20).map((p) => p[0]));
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (top.has(`${nums[i]}-${nums[j]}`)) pairHits++;
      }
    }
    const pairScore = Math.min(1, pairHits / 3);
    detail.pairHistory = pairScore;
    score += w.pairHistory * pairScore;

    const human = this.isHumanish(nums);
    const avoidH = human.length ? Math.max(0, 1 - human.length * 0.25) : 1;
    detail.avoidHumanPatterns = avoidH;
    detail.humanFlags = human;
    score += w.avoidHumanPatterns * avoidH;

    let exp = 0.5;
    if (w.experimentalGlobal > 0 && experimentalCtx) {
      // toy coupling — not causal
      const day = experimentalCtx.day;
      const hour = experimentalCtx.hour;
      const bias = ((day * 3 + hour) % 37) + 1;
      exp = nums.includes(bias) ? 0.8 : 0.4;
      detail.experimentalNote = `הטיה ניסיונית לכיוון ${bias} מתאריך/שעה — אין הוכחה להשפעה על הגרלה.`;
    }
    detail.experimentalGlobal = exp;
    score += w.experimentalGlobal * exp;

    // strong number mild bias from history
    const sFreq = (stats.strongFreq[strong] || 0) / (stats.totalDraws || 1);
    detail.strongFreq = sFreq;

    return {
      score,
      balanceScore: (eo + lh + spacing + filled + sumScore) / 5,
      detail,
      sum,
      evens,
      lows,
      consec,
      humanFlags: human,
    };
  },
};
