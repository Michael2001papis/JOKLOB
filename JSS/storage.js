/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

JOKLOB.storage = {
  KEY: "joklob_ui_v3",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || "{}");
    } catch {
      return {};
    }
  },
  get() {
    const d = this.load();
    d.tickets = d.tickets || [];
    d.last = d.last || null;
    d.compare = d.compare || [];
    d.history = d.history || [];
    d.period = d.period || "format37";
    d.experimentalMode = d.experimentalMode || "seed_only";
    return d;
  },
  save(d) {
    localStorage.setItem(this.KEY, JSON.stringify(d));
  },
  setLast(batch) {
    const d = this.get();
    d.last = batch;
    const t0 = batch.tickets?.[0];
    d.history.unshift({
      at: batch.createdAt,
      seed: batch.seed,
      method: batch.method,
      methodLabel: t0?.methodLabel,
      n: batch.tickets.length,
      numbers: t0?.numbers,
      strong: t0?.strong,
      researchScore: t0?.researchScore,
      dataVersion: t0?.dataVersion,
      calcId: t0?.calcId,
    });
    d.history = d.history.slice(0, 50);
    this.save(d);
  },
  saveTicket(t) {
    const d = this.get();
    d.tickets.unshift(t);
    d.tickets = d.tickets.slice(0, 120);
    this.save(d);
  },
};
