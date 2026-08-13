/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 */
window.JOKLOB = window.JOKLOB || {};

JOKLOB.charts = {
  esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },
  bars(items, { title = "", valueKey = "v", labelKey = "l", max = 0 } = {}) {
    const data = (items || []).filter((x) => x);
    if (!data.length) return "";
    const hi = max || Math.max(...data.map((x) => Number(x[valueKey]) || 0), 1);
    const rows = data
      .map((x) => {
        const v = Number(x[valueKey]) || 0;
        const w = Math.max(2, (v / hi) * 100);
        return `<div class="bar-row"><span class="bar-l">${this.esc(x[labelKey])}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${w}%"></span></span>
          <span class="bar-v">${this.esc(x.display != null ? x.display : v)}</span></div>`;
      })
      .join("");
    return `<div class="chart-card"><div class="chart-title">${this.esc(title)}</div>${rows}</div>`;
  },
  cols(items, { title = "", valueKey = "v", labelKey = "l" } = {}) {
    const data = items || [];
    if (!data.length) return "";
    const hi = Math.max(...data.map((x) => Number(x[valueKey]) || 0), 1);
    const cols = data
      .map((x) => {
        const v = Number(x[valueKey]) || 0;
        const h = Math.max(4, (v / hi) * 120);
        return `<div class="col"><div class="col-fill" style="height:${h}px"></div>
          <div class="col-l">${this.esc(x[labelKey])}</div></div>`;
      })
      .join("");
    return `<div class="chart-card"><div class="chart-title">${this.esc(title)}</div>
      <div class="col-chart">${cols}</div></div>`;
  },
};
