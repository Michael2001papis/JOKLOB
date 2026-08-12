window.JOKLOB = window.JOKLOB || {};

JOKLOB.ui = {
  esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  balls(numbers, strong) {
    const main = (numbers || []).map((n) => `<div class="ball">${n}</div>`).join("");
    const s = strong != null ? `<div class="ball strong" title="מספר חזק">${strong}</div>` : "";
    return `<div class="balls">${main}${s}</div>`;
  },
  ticketCard(t, opts = {}) {
    const exp = t.experimental ? `<span class="chip exp">מודל ניסיוני</span>` : "";
    const weights = Object.entries(t.weightsUsed || {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${JOKLOB.metrics.labels[k] || k}: ${Number(v).toFixed(2)}`)
      .join(" · ");
    const reasons = Object.entries(t.numberReasons || {})
      .map(([n, rs]) => `<li><b>${n}</b>: ${this.esc((rs || []).join("; "))}</li>`)
      .join("");
    return `
      <article class="card ticket" data-calc="${this.esc(t.calcId)}">
        <div class="chip">${this.esc(t.methodLabel)}</div> ${exp}
        <div class="muted">קבוצה ${t.group}${opts.mode === "double" || t.board > 1 ? ` · לוח ${t.board}` : ""}</div>
        ${this.balls(t.numbers, t.strong)}
        <div class="ticket-meta">
          ציון איזון: <b>${t.balanceScore.toFixed(3)}</b> ·
          ציון משוקלל: <b>${t.score.toFixed(3)}</b> ·
          סכום: <b>${t.sum}</b><br>
          מזהה: <span dir="ltr">${this.esc(t.calcId)}</span><br>
          Seed: <span dir="ltr">${this.esc(t.seed)}</span><br>
          נוצר: ${this.esc(new Date(t.createdAt).toLocaleString("he-IL"))}
        </div>
        <details>
          <summary>שקיפות החישוב</summary>
          <p><b>נתונים שנבדקו:</b> ${t.dataChecked.draws} הגרלות · ${this.esc(t.dataChecked.sourceNote)}</p>
          <p><b>משקלים:</b> ${this.esc(weights || "אין (אקראי טהור)")}</p>
          <p><b>מדדים:</b></p>
          <pre>${this.esc(JSON.stringify(t.metricsDetail, null, 2))}</pre>
          <p><b>למה כל מספר:</b></p>
          <ul>${reasons}</ul>
          <p class="warn">${this.esc(t.disclaimer)}</p>
        </details>
        <div class="actions">
          <button type="button" class="btn secondary" data-act="save" data-id="${this.esc(t.calcId)}">שמירה</button>
          <button type="button" class="btn secondary" data-act="compare" data-id="${this.esc(t.calcId)}">השוואה</button>
          <button type="button" class="btn secondary" data-act="variant" data-id="${this.esc(t.calcId)}">וריאציה</button>
          <button type="button" class="btn secondary" data-act="replay" data-id="${this.esc(t.calcId)}">אותו Seed</button>
        </div>
      </article>`;
  },
};
