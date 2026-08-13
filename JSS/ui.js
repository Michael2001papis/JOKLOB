/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

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
    const s = strong != null ? `<div class="ball strong" title="חזק">${strong}</div>` : "";
    return `<div class="balls">${main}${s}</div>`;
  },
  kindChip(kind) {
    const map = {
      "נתון היסטורי": "chip",
      "חישוב מתמטי": "chip",
      "התאמה למודל": "chip model",
      "התאמה למודל המחקרי + אקראיות משוקללת": "chip model",
      "התאמה למודל + אקראיות": "chip model",
      סימולציה: "chip",
      ניסוי: "chip exp",
      השערה: "chip exp",
      "תוצאה אקראית": "chip",
    };
    return `<span class="${map[kind] || "chip"}">${this.esc(kind || "")}</span>`;
  },
  ticketCard(t) {
    const parts = Object.entries(t.scoreParts || {})
      .map(([k, v]) => `${k}: ${typeof v === "number" ? v.toFixed(3) : JSON.stringify(v)}`)
      .join(" · ");
    const why = Object.entries(t.tags || {})
      .map(([n, tags]) => `<li><b>${n}</b>: ${this.esc((tags || []).join(", "))}</li>`)
      .join("");
    return `
      <article class="card ticket">
        <div>${this.kindChip(t.kind)} <span class="chip">${this.esc(t.methodLabel)}</span>
          ${t.experimentalMode === "weighted" ? '<span class="chip exp">שכבה ניסיונית משוקללת</span>' : ""}
        </div>
        <div class="muted">קבוצה ${t.group}${t.board > 1 || t.board === 1 && t.method ? "" : ""}${t.board ? ` · לוח ${t.board}` : ""}</div>
        ${this.balls(t.numbers, t.strong)}
        <div class="ticket-meta">
          <b>ציון התאמה למודל המחקרי:</b> ${Number(t.researchScore || 0).toFixed(3)}
          <span class="muted">(לא סיכוי זכייה)</span><br>
          אש: <b>${(t.firePicked || []).join(", ") || "-"}</b> ·
          לחץ: <b>${(t.pressurePicked || []).join(", ") || "-"}</b><br>
          חם: ${(t.hotPicked || []).join(", ") || "-"} · קר: ${(t.coldPicked || []).join(", ") || "-"}<br>
          זוגות שנכללו: ${(t.pairsIncluded || []).join(" · ") || "-"} ·
          רצפים: ${(t.sequencesIncluded || []).join(" · ") || "-"}<br>
          סכום ${t.signature?.sum} · זוגי/אי־זוגי ${t.signature?.evenOdd?.join(":")} ·
          טווחים ${t.signature?.bandPattern}<br>
          רכיב אקראי בציון: ${Math.round((t.randomShare || 0) * 100)}%<br>
          גרסת מאגר: ${this.esc(t.dataVersion?.source)} · ${t.dataVersion?.drawsUsed} הגרלות<br>
          Seed: <span dir="ltr">${this.esc(t.seed)}</span><br>
          מזהה: <span dir="ltr">${this.esc(t.calcId)}</span>
        </div>
        <details>
          <summary>למה נבחר כל מספר? / שלבי ציון</summary>
          <ol>${(t.steps || []).map((s) => `<li>${this.esc(s)}</li>`).join("")}</ol>
          <ul>${why}</ul>
          <p><b>תרומת רכיבים לציון התאמה למודל המחקרי:</b> ${this.esc(parts)}</p>
          <pre>${this.esc(JSON.stringify(t.scoreWeights || {}, null, 2))}</pre>
          <p class="warn">${this.esc(t.disclaimer)}</p>
          <p class="muted">© 2026 JOKLOB / מיכאל · כל הזכויות שמורות</p>
        </details>
        <div class="actions">
          <button type="button" class="btn secondary" data-act="save" data-id="${this.esc(t.calcId)}">שמירה</button>
          <button type="button" class="btn secondary" data-act="variant" data-id="${this.esc(t.calcId)}">וריאציה</button>
          <button type="button" class="btn secondary" data-act="replay" data-id="${this.esc(t.calcId)}">אותו Seed</button>
          <button type="button" class="btn secondary" data-act="pdf-one" data-id="${this.esc(t.calcId)}">PDF</button>
        </div>
      </article>`;
  },
  numList(arr) {
    return `<span dir="ltr">${(arr || []).join(", ")}</span>`;
  },
};
