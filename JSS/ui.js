/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
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
    return `<div class="balls" aria-hidden="true">${main}${s}</div>`;
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
    const why = Object.entries(t.tags || {})
      .map(([n, tags]) => `<li><b>${n}</b>: ${this.esc((tags || []).join(", "))}</li>`)
      .join("");
    const parts = Object.entries(t.scoreParts || {})
      .map(([k, v]) => `${k}: ${typeof v === "number" ? v.toFixed(3) : this.esc(JSON.stringify(v))}`)
      .join(" · ");
    return `
      <article class="card ticket" id="ticket-${this.esc(t.calcId)}">
        <div>${this.kindChip(t.kind)} <span class="chip model">${this.esc(t.methodLabel)}</span></div>
        ${this.balls(t.numbers, t.strong)}
        <div class="ticket-meta">
          <b>ציון התאמה למודל המחקרי:</b> ${Number(t.researchScore || 0).toFixed(3)}
          <span class="muted"> — אינו סיכוי זכייה</span><br>
          סכום ${t.signature?.sum} · זוגי/אי־זוגי ${t.signature?.evenOdd?.join(":")} ·
          טווחים ${t.signature?.bandPattern}
        </div>
        <div class="actions three">
          <button type="button" class="btn" data-act="save" data-id="${this.esc(t.calcId)}">שמירה</button>
          <button type="button" class="btn secondary" data-act="variant" data-id="${this.esc(t.calcId)}">וריאציה</button>
          <div class="menu">
            <button type="button" class="btn secondary" data-act="more-menu" data-id="${this.esc(t.calcId)}" aria-haspopup="true">עוד</button>
            <div class="menu-pop hidden" data-menu="${this.esc(t.calcId)}">
              <button type="button" data-act="replay" data-id="${this.esc(t.calcId)}">שחזור באותו Seed</button>
              <button type="button" data-act="pdf-one" data-id="${this.esc(t.calcId)}">ייצוא PDF</button>
              <button type="button" data-act="copy-seed" data-id="${this.esc(t.calcId)}">העתקת Seed</button>
              <button type="button" data-act="show-ver" data-id="${this.esc(t.calcId)}">גרסת המאגר</button>
            </div>
          </div>
        </div>
        <details>
          <summary>למה נבחר כל מספר?</summary>
          <ol>${(t.steps || []).map((s) => `<li>${this.esc(s)}</li>`).join("")}</ol>
          <ul>${why}</ul>
        </details>
        <details>
          <summary>מדדי אש, לחץ, חם וקר</summary>
          <p>אש: <b>${(t.firePicked || []).join(", ") || "-"}</b> · לחץ: <b>${(t.pressurePicked || []).join(", ") || "-"}</b></p>
          <p>חם: ${(t.hotPicked || []).join(", ") || "-"} · קר: ${(t.coldPicked || []).join(", ") || "-"}</p>
        </details>
        <details>
          <summary>זוגות, שלשות ורצפים</summary>
          <p>זוגות: ${(t.pairsIncluded || []).join(" · ") || "-"}</p>
          <p>רצפים: ${(t.sequencesIncluded || []).join(" · ") || "-"}</p>
        </details>
        <details>
          <summary>פרטי החישוב</summary>
          <p>רכיב אקראי בציון: ${Math.round((t.randomShare || 0) * 100)}%</p>
          <p>${this.esc(parts)}</p>
          <p class="warn">${this.esc(t.disclaimer)}</p>
        </details>
        <details>
          <summary>נתוני שחזור ומאגר</summary>
          <p>Seed: <span dir="ltr">${this.esc(t.seed)}</span></p>
          <p>מזהה: <span dir="ltr">${this.esc(t.calcId)}</span></p>
          <p>גרסת מאגר: ${this.esc(t.dataVersion?.source)} · ${t.dataVersion?.drawsUsed} הגרלות</p>
          <p class="muted">© 2026 JOKLOB / מיכאל · כל הזכויות שמורות</p>
        </details>
      </article>`;
  },
  numList(arr) {
    return `<span dir="ltr">${(arr || []).join(", ")}</span>`;
  },
  dataList(cfg) {
    const id = cfg.id;
    const cols = cfg.columns || [];
    const rows = cfg.rows || [];
    const cardKeys = cfg.cardKeys || cols.slice(0, 4).map((c) => c.key);
    const limit = cfg.limit || 10;
    const head = cols.map((c) => `<th data-sort="${this.esc(c.key)}">${this.esc(c.he)}</th>`).join("");
    const body = rows
      .map((r, i) => {
        const tds = cols.map((c) => `<td>${this.esc(r[c.key])}</td>`).join("");
        return `<tr data-i="${i}" class="${i < 3 ? "hi" : ""}">${tds}</tr>`;
      })
      .join("");
    const cards = rows
      .map((r, i) => {
        const main = cardKeys
          .map((k) => {
            const col = cols.find((c) => c.key === k);
            return `<div><span class="k">${this.esc(col?.he || k)}</span> <b>${this.esc(r[k])}</b></div>`;
          })
          .join("");
        const extra = cols
          .filter((c) => !cardKeys.includes(c.key))
          .map((c) => `<div><span class="k">${this.esc(c.he)}</span> ${this.esc(r[c.key])}</div>`)
          .join("");
        return `<article class="row-card" data-i="${i}">
          ${main}
          ${extra ? `<details><summary>פרטים נוספים</summary>${extra}</details>` : ""}
        </article>`;
      })
      .join("");
    return `
      <div class="data-list" data-list="${this.esc(id)}" data-limit="${limit}">
        <div class="toolbar">
          <input type="search" data-search placeholder="חיפוש" aria-label="חיפוש" />
          <select data-sort-pick aria-label="מיון">
            ${cols.map((c) => `<option value="${this.esc(c.key)}">${this.esc(c.he)}</option>`).join("")}
          </select>
        </div>
        ${cfg.chart || ""}
        <div class="mobile-cards mobile-only">${cards}</div>
        <div class="tbl-wrap desktop-table desktop-only"><table class="tbl">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table></div>
        <button type="button" class="btn secondary" data-more>הצג הכול (${rows.length})</button>
      </div>`;
  },
  applyListFilter(root) {
    const boxes = root.matches?.("[data-list]")
      ? [root]
      : [...root.querySelectorAll("[data-list]")];
    boxes.forEach((box) => {
      const limit = Number(box.dataset.limit || 10);
      const q = (box.querySelector("[data-search]")?.value || "").trim();
      const cards = [...box.querySelectorAll(".row-card")];
      const rows = [...box.querySelectorAll("tbody tr")];
      let shown = 0;
      const match = (el) => !q || (el.textContent || "").includes(q);
      const all = box.dataset.all === "1";
      cards.forEach((el) => {
        const ok = match(el) && (all || shown < limit);
        if (ok) shown++;
        el.classList.toggle("hidden", !ok);
      });
      shown = 0;
      rows.forEach((el) => {
        const ok = match(el) && (all || shown < limit);
        if (ok) shown++;
        el.classList.toggle("hidden", !ok);
      });
    });
  },
  toast(msg, type = "") {
    const host = document.getElementById("toasts");
    if (!host) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  },
  confirm(msg) {
    return new Promise((resolve) => {
      const modal = document.getElementById("modal");
      const text = document.getElementById("modal-text");
      const ok = document.getElementById("modal-ok");
      const cancel = document.getElementById("modal-cancel");
      if (!modal || !ok) {
        resolve(window.confirm(msg));
        return;
      }
      text.textContent = msg;
      modal.classList.remove("hidden");
      const done = (v) => {
        modal.classList.add("hidden");
        ok.onclick = null;
        cancel.onclick = null;
        resolve(v);
      };
      ok.onclick = () => done(true);
      cancel.onclick = () => done(false);
    });
  },
  archiveShort(db) {
    if (!db) return "מאגר";
    const n = db.draws?.length || 0;
    const date = db.updatedAt ? new Date(db.updatedAt).toLocaleDateString("he-IL") : "";
    const kind = db.isOfficial ? "מאגר רשמי" : db.isDemo ? "מאגר הדגמה" : "מאגר";
    return `${kind} · ${n.toLocaleString("he-IL")} הגרלות${date ? " · " + date : ""}`;
  },
};
