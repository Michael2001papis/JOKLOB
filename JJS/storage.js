window.JOKLOB = window.JOKLOB || {};

JOKLOB.storage = {
  key: "joklob_saved_v2",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '{"tickets":[],"last":null,"compare":[]}');
    } catch {
      return { tickets: [], last: null, compare: [] };
    }
  },
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  get() {
    const d = this.load();
    if (!d.tickets) d.tickets = [];
    if (!d.compare) d.compare = [];
    return d;
  },
  setLast(batch) {
    const d = this.get();
    d.last = batch;
    this.save(d);
  },
  saveTicket(ticket) {
    const d = this.get();
    d.tickets.unshift(ticket);
    d.tickets = d.tickets.slice(0, 100);
    this.save(d);
  },
  toggleCompare(ticket) {
    const d = this.get();
    const i = d.compare.findIndex((t) => t.calcId === ticket.calcId);
    if (i >= 0) d.compare.splice(i, 1);
    else {
      d.compare.unshift(ticket);
      d.compare = d.compare.slice(0, 6);
    }
    this.save(d);
    return d.compare;
  },
};
