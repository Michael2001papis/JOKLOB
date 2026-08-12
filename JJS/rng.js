window.JOKLOB = window.JOKLOB || {};

/** Secure random + reproducible seeded PRNG (mulberry32). */
JOKLOB.rng = {
  bytes(n) {
    const a = new Uint32Array(n);
    crypto.getRandomValues(a);
    return a;
  },
  newSeed() {
    const a = this.bytes(2);
    return (`${a[0].toString(16)}${a[1].toString(16)}`).padStart(16, "0");
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
      t |= 0;
      t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  },
  /** Fisher–Yates sample k distinct ints from [lo, hi] inclusive */
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
};
