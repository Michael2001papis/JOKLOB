window.JOKLOB = window.JOKLOB || {};

/** Secure + seeded RNG */
JOKLOB.rng = {
  newSeed() {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return `${a[0].toString(16).padStart(8, "0")}${a[1].toString(16).padStart(8, "0")}`;
  },
  fromSeed(seed) {
    let h = 2166136261 >>> 0;
    const s = String(seed || "0");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let t = h >>> 0;
    return function next() {
      t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  },
  sampleDistinct(lo, hi, k, rand) {
    const pool = [];
    for (let i = lo; i <= hi; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, k).sort((a, b) => a - b);
  },
  int(lo, hi, rand) {
    return lo + Math.floor(rand() * (hi - lo + 1));
  },
  pickWeighted(items, weights, rand) {
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let r = rand() * sum;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  },
};
