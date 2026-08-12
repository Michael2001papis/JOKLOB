window.JOKLOB = window.JOKLOB || {};

JOKLOB.storage = {
  key: "joklob_data_v1",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "{}");
    } catch {
      return {};
    }
  },
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  get() {
    const d = this.load();
    if (!d.projects) d.projects = [];
    if (!d.history) d.history = [];
    if (!d.docs) d.docs = [];
    if (!d.drafts) d.drafts = {};
    return d;
  },
  set(mutator) {
    const d = this.get();
    mutator(d);
    this.save(d);
    return d;
  },
  addHistory(entry) {
    this.set((d) => {
      d.history.unshift({ ...entry, at: new Date().toISOString() });
      d.history = d.history.slice(0, 80);
    });
  },
};
