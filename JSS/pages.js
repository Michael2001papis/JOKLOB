/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 */
window.JOKLOB = window.JOKLOB || {};
JOKLOB.copyright = {
  owner: "JOKLOB / מיכאל",
  year: 2026,
  notice: "Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved. כל הזכויות שמורות.",
};

const FREQ_COLS = [
  { key: "n", he: "#" },
  { key: "count", he: "הופעות" },
  { key: "rankHistoric", he: "דירוג" },
  { key: "trend", he: "מגמה" },
  { key: "rate", he: "שיעור" },
  { key: "expected", he: "צפוי" },
  { key: "deviation", he: "סטייה" },
  { key: "rankRecent", he: "אחרון" },
  { key: "rankChange", he: "שינוי" },
  { key: "since", he: "שקט" },
  { key: "avgGap", he: "פער ממוצע" },
  { key: "maxGap", he: "ארוך" },
  { key: "minGap", he: "קצר" },
  { key: "quietPercentile", he: "אחוזון שקט" },
];

function freqRow(x) {
  return {
    n: x.n,
    count: x.count,
    rate: `${(x.rate * 100).toFixed(2)}%`,
    expected: x.expected.toFixed(1),
    deviation: x.deviation.toFixed(1),
    rankHistoric: x.rankHistoric,
    rankRecent: x.rankRecent,
    rankChange: x.rankChange,
    trend: x.strengthening ? "התחזקות" : x.weakening ? "היחלשות" : "יציב",
    since: x.since,
    avgGap: x.avgGap.toFixed(1),
    maxGap: x.maxGap,
    minGap: x.minGap,
    quietPercentile: x.quietPercentile.toFixed(0),
  };
}

JOKLOB.pages = {
  _back() {
    return `<button type="button" class="btn secondary" data-go-back>${JOKLOB.icons.back} חזרה</button>`;
  },
  _draws() {
    return JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
  },

  home() {
    const methods = Object.entries(JOKLOB.generator.METHODS)
      .map(([id, m]) => `<option value="${id}">${m.he}</option>`)
      .join("");
    const st = JOKLOB.storage.get();
    const periods = JOKLOB.data
      .periodOptions()
      .map((p) => `<option value="${p.id}"${p.id === (st.period || "format37") ? " selected" : ""}>${p.he}</option>`)
      .join("");
    const db = JOKLOB.data.load();
    const first = !localStorage.getItem("joklob_seen_about");
    const welcome = first
      ? `<div class="card" id="welcome-card">
          <h2>שלושה צעדים להתחלה</h2>
          <ol class="welcome-steps">
            <li><b>בדקו את המאגר</b> — הקובץ הרשמי כבר טעון.</li>
            <li><b>בחרו מודל</b> — ברירת המחדל היא המודל ההיברידי של מיכאל.</li>
            <li><b>צרו צירוף</b> — לחצו על הכפתור הראשי למטה.</li>
          </ol>
          <div class="actions">
            <button type="button" class="btn" id="welcome-start">התחל עכשיו</button>
            <button type="button" class="btn secondary" data-go="about">פתח מדריך מלא</button>
          </div>
          <button type="button" class="btn secondary" id="welcome-skip">אל תציג שוב</button>
        </div>`
      : "";
    return `
      <h1>מחולל מחקרי</h1>
      <p class="engine-title desktop-only">מנוע המחקר של מיכאל</p>
      ${welcome}
      <div class="card desktop-only">
        <p style="margin:0"><b>${JOKLOB.ui.esc(JOKLOB.ui.archiveShort(db))}</b></p>
      </div>
      <div class="disclaimer"><b>גילוי נאות:</b> ציון התאמה ≠ סיכוי זכייה.</div>
      <div class="card" id="gen-form">
        <label>סוג</label>
        <div class="seg" id="mode-seg">
          <button type="button" data-mode="regular" class="on">לוטו רגיל</button>
          <button type="button" data-mode="double">דאבל לוטו</button>
        </div>
        <label>מודל</label>
        <select id="method">${methods}</select>
        <label>מספר צירופים</label>
        <input id="count" type="number" min="1" max="20" value="1" />
        <button type="button" class="btn big" id="generate">צור צירוף מחקרי</button>
        <details id="adv-settings">
          <summary>הגדרות מתקדמות</summary>
          <label>תקופת מחקר</label>
          <select id="period">${periods}</select>
          <label>שכבה ניסיונית עולמית</label>
          <select id="exp-mode">
            <option value="seed_only" ${st.experimentalMode === "seed_only" ? "selected" : ""}>Seed בלבד (לא משפיע על ציון סטטיסטי)</option>
            <option value="weighted" ${st.experimentalMode === "weighted" ? "selected" : ""}>משקל ניסיוני מוגבל (≤10%)</option>
            <option value="off">כבוי</option>
          </select>
          <label>Seed (ריק = חדש)</label>
          <input id="seed" dir="ltr" placeholder="להדבקה לשחזור מדויק" />
        </details>
      </div>
      <button type="button" class="btn sm secondary hidden" id="edit-settings">שינוי הגדרות</button>
      <div id="results"></div>`;
  },

  research() {
    const groups = JOKLOB.nav.groups
      .map(
        (g, i) => `<details class="card group-acc" ${i === 0 ? "open" : ""}>
        <summary>${g.he}</summary>
        <div class="grid-links">
          ${g.items
            .map(
              (it) => `<button type="button" class="tile" data-go="${it.id}">
              ${JOKLOB.icons[it.icon] || ""}
              <span><b>${it.he}</b><span class="hint">${it.hint}</span></span>
              <span class="chev">${JOKLOB.icons.chev}</span>
            </button>`
            )
            .join("")}
        </div>
      </details>`
      )
      .join("");
    return `<h1>לוח מחקר</h1>
      <p>חישוב מחדש על המאגר העדכני, מחולק לקבוצות. השוואה לצילום 08.08.2026 זמינה במסכים הרלוונטיים.</p>
      ${groups}`;
  },

  "r-overview"() {
    const { draws } = this._draws();
    const r = JOKLOB.analyze.fullReport(draws);
    const db = JOKLOB.data.load();
    return `
      ${this._back()}
      <h1>לוח מחקר ראשי</h1>
      <div class="card">
        <p>מקור: <b>${JOKLOB.ui.esc(db.sourceLabel || "—")}</b></p>
        <p>מדגם פעיל: <b>${r.sampleSize}</b> · <span class="chip">חישוב מתמטי</span></p>
        <p>ממוצע סכום: <b>${r.shadow.mean.toFixed(1)}</b> · חציון: <b>${r.shadow.median}</b> · P25–P75: <b>${r.shadow.p25}–${r.shadow.p75}</b></p>
        <p>חמים: ${JOKLOB.ui.numList(r.classes.hot.slice(0, 12))}</p>
        <p>קרים: ${JOKLOB.ui.numList(r.classes.cold.slice(0, 12))}</p>
        <p>אש: ${JOKLOB.ui.numList(r.classes.fireTop)}</p>
        <p>לחץ: ${JOKLOB.ui.numList(r.classes.pressureTop)}</p>
      </div>`;
  },

  "r-hot"() { return this._classPage("חמים", "hot", JOKLOB.snapshot.hot); },
  "r-cold"() { return this._classPage("קרים", "cold", JOKLOB.snapshot.cold); },
  "r-quiet"() { return this._classPage("שקטים", "quiet", JOKLOB.snapshot.quiet); },
  _classPage(title, key, snap) {
    const { draws } = this._draws();
    const r = JOKLOB.analyze.classifyNumbers(draws);
    const list = r[key] || [];
    const rows = r.cmp.enriched.filter((x) => list.includes(x.n)).map(freqRow);
    const chart = JOKLOB.charts.bars(
      rows.slice(0, 10).map((x) => ({ l: x.n, v: x.count })),
      { title: "הופעות — 10 ראשונים" }
    );
    return `
      ${this._back()}
      <h1>מספרים ${title}</h1>
      <div class="card">
        <p><span class="chip">חישוב מתמטי</span> מדגם ${r.cmp.sampleSize}</p>
        <p>מחושב: ${JOKLOB.ui.numList(list)}</p>
        <p>צילום 08.08.2026: ${JOKLOB.ui.numList(snap)}</p>
        ${JOKLOB.ui.dataList({ id: key, columns: FREQ_COLS, rows, cardKeys: ["n", "count", "rankHistoric", "trend"], chart })}
      </div>`;
  },

  "r-freq"() {
    const { draws } = this._draws();
    const cmp = JOKLOB.analyze.compareWindows(draws);
    const rows = cmp.enriched.slice().sort((a, b) => a.n - b.n).map(freqRow);
    const top = cmp.enriched.slice().sort((a, b) => b.count - a.count).slice(0, 10);
    const chart = JOKLOB.charts.bars(
      top.map((x) => ({ l: x.n, v: x.count })),
      { title: "10 השכיחים במדגם" }
    ) + JOKLOB.charts.cols(
      rows.map((x) => ({ l: x.n, v: x.count })),
      { title: "שכיחויות 1–37 (לא תחזית)" }
    );
    return `
      ${this._back()}
      <h1>מנוע שכיחויות</h1>
      <div class="card">
        <p><span class="chip">חישוב מתמטי</span> מדגם ${cmp.sampleSize} · חלון אחרון ${cmp.recentSize} · 1–37 בלבד</p>
        <p class="muted">מספרים 38–49 אינם מוצגים כקרים — הם לא בפורמט הנוכחי.</p>
        ${JOKLOB.ui.dataList({ id: "freq", columns: FREQ_COLS, rows, cardKeys: ["n", "count", "rankHistoric", "trend"], chart })}
      </div>`;
  },

  "r-fire"() {
    const { draws } = this._draws();
    const fire = JOKLOB.analyze.fireIndex(draws);
    const rows = fire.list.slice(0, 15).map((x) => ({
      n: x.n, score: x.score, recent: `${(x.parts.recent * 100).toFixed(0)}%`, historic: `${(x.parts.historic * 100).toFixed(0)}%`,
    }));
    const w = fire.weights;
    const chart = JOKLOB.charts.bars(rows.map((x) => ({ l: x.n, v: x.score })), { title: "מדד אש — דירוג" });
    return `
      ${this._back()}
      <h1>מדד אש</h1>
      <div class="card">
        <p>ברירת מחדל: 40% אחרון · 30% היסטורי · 20% מגמה · 10% יציבות</p>
        <div class="weight-row"><label>אחרון</label><input type="range" min="0" max="1" step="0.05" id="fw-recent" value="${w.recent}" /></div>
        <div class="weight-row"><label>היסטורי</label><input type="range" min="0" max="1" step="0.05" id="fw-historic" value="${w.historic}" /></div>
        <div class="weight-row"><label>מגמה</label><input type="range" min="0" max="1" step="0.05" id="fw-trend" value="${w.trend}" /></div>
        <div class="weight-row"><label>יציבות</label><input type="range" min="0" max="1" step="0.05" id="fw-stability" value="${w.stability}" /></div>
        <button type="button" class="btn" id="save-fire-w">שמור משקלים וחשב</button>
        <p>צילום מקורי (ייחוס): ${JOKLOB.ui.numList(JOKLOB.snapshot.fireThen)}</p>
        ${JOKLOB.ui.dataList({
          id: "fire",
          columns: [{ key: "n", he: "#" }, { key: "score", he: "אש" }, { key: "recent", he: "אחרון" }, { key: "historic", he: "היסטורי" }],
          rows, cardKeys: ["n", "score", "recent", "historic"], chart,
        })}
      </div>`;
  },

  "r-pressure"() {
    const { draws } = this._draws();
    const p = JOKLOB.analyze.pressureIndex(draws);
    const rows = p.list.slice(0, 15).map((x) => ({
      n: x.n, score: x.score, since: x.since, q: x.quietPercentile.toFixed(0),
      hist: `${(x.histRate * 100).toFixed(2)}%`, recent: `${(x.recentRate * 100).toFixed(2)}%`, gap: x.avgGap.toFixed(1),
    }));
    const chart = JOKLOB.charts.bars(rows.map((x) => ({ l: x.n, v: x.score })), { title: "מדד לחץ — דירוג" });
    return `
      ${this._back()}
      <h1>מדד לחץ</h1>
      <div class="disclaimer"><b>אזהרה:</b> ${JOKLOB.ui.esc(p.warning)}</div>
      <div class="card">
        <p>צילום מקורי (ייחוס): ${JOKLOB.ui.numList(JOKLOB.snapshot.pressureThen)}</p>
        ${JOKLOB.ui.dataList({
          id: "pressure",
          columns: [
            { key: "n", he: "#" }, { key: "score", he: "לחץ" }, { key: "since", he: "שקט" }, { key: "q", he: "אחוזון" },
            { key: "hist", he: "היסט." }, { key: "recent", he: "אחרון" }, { key: "gap", he: "פער ממוצע" },
          ],
          rows, cardKeys: ["n", "score", "since", "q"], chart,
        })}
      </div>`;
  },

  "r-pairs"() {
    const { draws } = this._draws();
    const pt = JOKLOB.analyze.pairsAndTriples(draws);
    const pairCols = [
      { key: "key", he: "זוג" }, { key: "count", he: "הופעות" }, { key: "rank", he: "דירוג" },
      { key: "ratio", he: "יחס" }, { key: "last", he: "אחרון" }, { key: "recentCount", he: "חלון אחרון" },
      { key: "expected", he: "צפוי" }, { key: "stable", he: "יציב" }, { key: "suspect", he: "בדיקות מקריות" },
    ];
    const mapRow = (x) => ({
      key: x.key, count: x.count, last: x.last || "-", recentCount: x.recentCount,
      expected: x.expected.toFixed(3), ratio: x.ratio.toFixed(2), rank: x.rank,
      stable: x.stable ? "יציב" : "לא", suspect: x.multipleTestingSuspect ? "חשד" : "",
    });
    return `
      ${this._back()}
      <h1>זוגות ושלשות</h1>
      <p>${JOKLOB.ui.esc(pt.note)}</p>
      <div class="tabs" role="tablist">
        <button type="button" class="tab on" data-tab="pairs">זוגות</button>
        <button type="button" class="tab" data-tab="trips">שלשות</button>
        <button type="button" class="tab" data-tab="snap">צילום מחקר</button>
      </div>
      <div class="card" data-panel="pairs">
        ${JOKLOB.ui.dataList({ id: "pairs", columns: pairCols, rows: pt.pairs.slice(0, 18).map(mapRow), cardKeys: ["key", "count", "rank", "ratio"] })}
      </div>
      <div class="card hidden" data-panel="trips">
        ${JOKLOB.ui.dataList({ id: "trips", columns: pairCols.map((c) => (c.key === "key" ? { ...c, he: "שלשה" } : c)), rows: pt.triples.slice(0, 12).map(mapRow), cardKeys: ["key", "count", "rank", "ratio"] })}
      </div>
      <div class="card hidden" data-panel="snap">
        <h2>צילום מחקר מקורי — זוגות (ייחוס)</h2>
        <p>${JOKLOB.snapshot.keyPairs.map((p) => p.join("-")).join(" · ")}</p>
        <h2>צילום — שלשות</h2>
        <p>${JOKLOB.snapshot.keyTriples.map((p) => p.join("-")).join(" · ")}</p>
      </div>`;
  },

  "r-seq"() {
    const { draws } = this._draws();
    const s = JOKLOB.analyze.sequences(draws);
    const rows = s.top.map((x) => ({ key: x.key, count: x.count }));
    return `
      ${this._back()}
      <h1>רצפים</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(s.note)}</p>
        <p>ללא רצף: ${s.none} · רצף של שניים: ${s.two} · 3+: ${s.threePlus}</p>
        ${JOKLOB.ui.dataList({
          id: "seq",
          columns: [{ key: "key", he: "רצף" }, { key: "count", he: "הופעות" }],
          rows, cardKeys: ["key", "count"],
        })}
        <p>צילום מחקר (ייחוס): ${JOKLOB.snapshot.keySequences.map((x) => x.join("-")).join(" · ")}</p>
      </div>`;
  },

  "r-shadow"() {
    const { draws } = this._draws();
    const sh = JOKLOB.analyze.shadowStats(draws);
    const chart = JOKLOB.charts.cols(
      [
        { l: "P10", v: sh.p10 }, { l: "P25", v: sh.p25 }, { l: "חציון", v: sh.median },
        { l: "ממוצע", v: sh.mean }, { l: "P75", v: sh.p75 }, { l: "P90", v: sh.p90 },
      ],
      { title: "התפלגות סכומים (אחוזונים)" }
    );
    return `
      ${this._back()}
      <h1>צל הגרלה</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(sh.note)}</p>
        <p>ממוצע סכום: <b>${sh.mean.toFixed(2)}</b> · חציון: <b>${sh.median}</b></p>
        <p>אחוזונים: P10=${sh.p10} · P25=${sh.p25} · P75=${sh.p75} · P90=${sh.p90}</p>
        <p>ייחוס מחקר: מרכז ${sh.researchRef.sumCenter}, אזור ${sh.researchRef.sumBand.join("–")}</p>
        ${chart}
      </div>`;
  },

  "r-strong"() {
    const { draws } = this._draws();
    const s = JOKLOB.analyze.strongAnalysis(draws);
    const rows = s.list.map((x) => ({
      strong: x.strong, count: x.count, hist: `${(x.rate * 100).toFixed(1)}%`,
      recent: `${(x.recentRate * 100).toFixed(1)}%`, since: x.since,
      trend: x.trend.toFixed(3), fire: x.fire, pressure: x.pressure,
    }));
    const chart = JOKLOB.charts.bars(rows.map((x) => ({ l: x.strong, v: x.count })), { title: "הופעות המספר החזק" });
    return `
      ${this._back()}
      <h1>מנוע המספר החזק</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(s.note)}</p>
        <p>צילום: ${s.snapshotStrong.join(", ")} — הדירוג הפעיל מחושב מהמאגר.</p>
        ${JOKLOB.ui.dataList({
          id: "strong",
          columns: [
            { key: "strong", he: "חזק" }, { key: "count", he: "הופעות" }, { key: "hist", he: "היסט." },
            { key: "recent", he: "אחרון" }, { key: "since", he: "שקט" }, { key: "fire", he: "אש" }, { key: "pressure", he: "לחץ" },
          ],
          rows, cardKeys: ["strong", "count", "recent", "fire"], chart, limit: 7,
        })}
      </div>`;
  },

  "r-world"() {
    const w = JOKLOB.world.snapshot();
    const extra = JOKLOB.world.loadExtra();
    return `
      ${this._back()}
      <h1>שכבת הקשר עולמית</h1>
      <div class="disclaimer"><b>ניסוי / השערה:</b> ${JOKLOB.ui.esc(w.disclaimer)}</div>
      <div class="card">
        <p><span class="chip exp">שכבה ניסיונית נפרדת</span></p>
        <p>יום: <b>${w.weekdayHe}</b> · ${w.dayOfMonth}/${w.month}/${w.year} · שעה ${w.hour}</p>
        <p>שווקים: ${w.markets.value ?? "—"} · אירועים: ${w.news.value ?? "—"}</p>
        <label>תנודתיות ידנית (0–100)</label>
        <input id="world-vol" type="number" min="0" max="100" value="${extra.volatility || ""}" />
        <label>אירועים חריגים ידני</label>
        <input id="world-ev" type="number" min="0" max="50" value="${extra.events || ""}" />
        <button type="button" class="btn" id="save-world">שמור הזנה ידנית</button>
      </div>`;
  },

  "r-snapshot"() {
    const s = JOKLOB.snapshot;
    return `
      ${this._back()}
      <h1>${s.nameHe}</h1>
      <div class="card">
        <p><span class="chip">נתון היסטורי / צילום מצב</span></p>
        <p>${JOKLOB.ui.esc(s.disclaimer)}</p>
        <p>כ־${s.drawsInArchiveApprox} הגרלות · אחרונה #${s.lastDrawNumber} ב־${s.lastDrawDate}</p>
        <p>תוצאה: ${JOKLOB.ui.numList(s.lastResult.numbers)} | חזק ${s.lastResult.strong}</p>
        <p>חמים: ${JOKLOB.ui.numList(s.hot)}</p>
        <p>קרים: ${JOKLOB.ui.numList(s.cold)}</p>
        <p>שקטים: ${JOKLOB.ui.numList(s.quiet)}</p>
        <p>אש אז: ${JOKLOB.ui.numList(s.fireThen)} · לחץ אז: ${JOKLOB.ui.numList(s.pressureThen)}</p>
      </div>`;
  },

  "r-history"() {
    const h = JOKLOB.storage.get().history;
    const items = h.length
      ? h
          .map(
            (x, i) => `<button type="button" class="list-item clickable card" data-hist="${i}">
            ${x.numbers ? JOKLOB.ui.balls(x.numbers, x.strong) : ""}
            <b dir="ltr">${JOKLOB.ui.esc(x.seed)}</b>
            <div class="muted">${JOKLOB.ui.esc(x.methodLabel || x.method)} · ${new Date(x.at).toLocaleString("he-IL")}</div>
          </button>`
          )
          .join("")
      : "<p class='muted'>אין עדיין</p>";
    return `${this._back()}<h1>היסטוריית חישובים</h1><div id="hist-list">${items}</div><div id="hist-detail"></div>`;
  },

  "r-period"() {
    const st = JOKLOB.storage.get();
    let custom = { from: "", to: "" };
    try { custom = JSON.parse(localStorage.getItem("joklob_custom_period") || "{}"); } catch { /* ignore */ }
    const opts = JOKLOB.data.periodOptions()
      .map((p) => `<option value="${p.id}"${p.id === (st.period || "format37") ? " selected" : ""}>${p.he}</option>`)
      .join("");
    return `
      ${this._back()}
      <h1>בחירת תקופה ופורמט</h1>
      <div class="card">
        <p>אין לערבב אוטומטית בין פורמטים. ברירת המחדל ליצירה: 6 מתוך 37.</p>
        <label>תקופה פעילה</label>
        <select id="period-pick">${opts}</select>
        <label>טווח מותאם — מתאריך</label>
        <input id="custom-from" type="date" value="${custom.from || ""}" />
        <label>עד תאריך</label>
        <input id="custom-to" type="date" value="${custom.to || ""}" />
        <button type="button" class="btn" id="save-period">שמור תקופה</button>
        <div id="period-status" class="muted"></div>
      </div>`;
  },

  "r-parity"() {
    const { draws } = this._draws();
    const sh = JOKLOB.analyze.shadowStats(draws);
    const rows = sh.evenOddTop.map((x) => ({ pattern: x.pattern, count: x.count, rate: `${(x.rate * 100).toFixed(1)}%` }));
    const chart = JOKLOB.charts.cols(rows.map((x) => ({ l: x.pattern, v: x.count })), { title: "התפלגות זוגי/אי־זוגי" });
    return `
      ${this._back()}
      <h1>זוגי ואי־זוגי</h1>
      <div class="card">
        <p><span class="chip">חישוב מתמטי</span> מדגם ${sh.sampleSize} · ייחוס 3:3</p>
        ${JOKLOB.ui.dataList({
          id: "parity",
          columns: [{ key: "pattern", he: "מבנה" }, { key: "count", he: "הופעות" }, { key: "rate", he: "שיעור" }],
          rows, cardKeys: ["pattern", "count", "rate"], chart, limit: 10,
        })}
      </div>`;
  },

  "r-ranges"() {
    const { draws } = this._draws();
    const sh = JOKLOB.analyze.shadowStats(draws);
    const labels = ["1–10", "11–20", "21–30", "31–37"];
    const avgRows = labels.map((l, i) => ({ band: l, avg: sh.bandAvg[i], dens: sh.bandDensityAvg[i] }));
    const patRows = sh.bandTop.map((x) => ({ pattern: x.pattern, count: x.count, rate: `${(x.rate * 100).toFixed(1)}%` }));
    const chart = JOKLOB.charts.cols(avgRows.map((x) => ({ l: x.band, v: x.dens })), { title: "צפיפות טווחים מנורמלת" });
    return `
      ${this._back()}
      <h1>פיזור טווחים</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(sh.note)}</p>
        ${chart}
        ${JOKLOB.ui.dataList({
          id: "ranges-avg",
          columns: [{ key: "band", he: "טווח" }, { key: "avg", he: "ממוצע" }, { key: "dens", he: "צפיפות" }],
          rows: avgRows, cardKeys: ["band", "avg", "dens"], limit: 4,
        })}
        <h2>דפוסים נפוצים</h2>
        ${JOKLOB.ui.dataList({
          id: "ranges-pat",
          columns: [{ key: "pattern", he: "דפוס" }, { key: "count", he: "הופעות" }, { key: "rate", he: "שיעור" }],
          rows: patRows, cardKeys: ["pattern", "count", "rate"],
        })}
      </div>`;
  },

  "r-compare"() {
    const cmp = JOKLOB.storage.get().compare || [];
    const last = cmp[0];
    const saved = last
      ? JOKLOB.ui.dataList({
          id: "cmp-saved",
          columns: [
            { key: "label", he: "מודל" }, { key: "numbers", he: "מספרים" }, { key: "strong", he: "חזק" },
            { key: "score", he: "ציון" }, { key: "sum", he: "סכום" },
          ],
          rows: (last.rows || []).map((r) => ({
            label: r.label, numbers: (r.numbers || []).join("-"), strong: r.strong,
            score: Number(r.researchScore || 0).toFixed(3), sum: r.sum,
          })),
          cardKeys: ["label", "numbers", "strong", "score"],
          limit: 10,
        })
      : "<p class='muted'>אין השוואה שמורה</p>";
    return `
      ${this._back()}
      <h1>השוואת מודלים</h1>
      <div class="card">
        <p>מריץ את כל המודלים על אותו Seed — השוואת מבנה וציון, לא סיכוי זכייה.</p>
        <label>Seed משותף</label>
        <input id="cmp-seed" dir="ltr" placeholder="ריק = Seed חדש" />
        <button type="button" class="btn" id="cmp-run">השווה מודלים</button>
        <div id="cmp-busy" class="busy hidden"><span class="spinner"></span> משווה מודלים…</div>
        <div id="cmp-out">${saved}</div>
        <details><summary>נתונים טכניים</summary><pre>${JOKLOB.ui.esc(JSON.stringify(cmp.slice(0, 2), null, 2))}</pre></details>
      </div>`;
  },

  "r-pdf"() {
    return `
      ${this._back()}
      <h1>ייצוא דוח PDF</h1>
      <div class="card">
        <p>מייצא את אצוות הצירופים האחרונה כדוח להדפסה.</p>
        <button type="button" class="btn" id="pdf-last">ייצא אצווה אחרונה</button>
        <button type="button" class="btn secondary" data-go="home">עבור למחולל</button>
        <div id="pdf-status" class="muted"></div>
      </div>`;
  },

  upload() {
    const db = JOKLOB.data.load();
    const fmt37 = (db.draws || []).filter((d) => d.format === JOKLOB.data.FORMAT_37).length;
    const last = [...(db.draws || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return `
      <h1>מאגר הגרלות</h1>
      <div class="card">
        <h2>מצב המאגר</h2>
        <div class="stat-grid">
          <div class="stat"><span>סוג</span><b>${db.isOfficial ? "רשמי" : db.isDemo ? "הדגמה" : "משתמש"}</b></div>
          <div class="stat"><span>הגרלות</span><b>${(db.draws || []).length.toLocaleString("he-IL")}</b></div>
          <div class="stat"><span>פורמט 6/37</span><b>${fmt37.toLocaleString("he-IL")}</b></div>
          <div class="stat"><span>אחרונה</span><b>#${last?.drawNumber || "—"}</b></div>
          <div class="stat"><span>תאריך אחרון</span><b>${last?.date || "—"}</b></div>
          <div class="stat"><span>עודכן</span><b>${db.updatedAt ? new Date(db.updatedAt).toLocaleString("he-IL") : "—"}</b></div>
        </div>
        <p class="muted">מקור: ${JOKLOB.ui.esc(db.sourceLabel || "—")}</p>
        ${db.isOfficial ? `<div class="disclaimer"><b>מאגר רשמי פעיל</b> — החישובים רצים על file/Lotto.csv.</div>` : ""}
        ${db.loadingOfficial ? `<div class="disclaimer">טוען את הקובץ הרשמי…</div>` : ""}
        ${db.isDemo ? `<div class="disclaimer">מוצג מאגר הדגמה. העלו קובץ אמיתי למחקר.</div>` : ""}
      </div>
      <div class="card">
        <h2>העלאת קובץ</h2>
        <div class="drop" id="drop-zone" tabindex="0">
          <b>בחירת קובץ מהמכשיר</b>
          <p class="muted">CSV / Excel. במחשב אפשר גם לגרור לכאן.</p>
          <div class="file-name" id="file-name">לא נבחר קובץ</div>
        </div>
        <input type="file" id="xlsx" accept=".xlsx,.xls,.csv" class="visually-hidden" />
        <div class="progress hidden" id="file-progress"><span></span></div>
        <div id="file-preview" class="muted"></div>
        <details>
          <summary>אפשרויות ייבוא נוספות</summary>
          <label>הדבקת CSV / טקסט</label>
          <textarea id="csv" dir="ltr"></textarea>
          <label>PDF</label>
          <input type="file" id="pdf" accept=".pdf" />
          <label>הקלדה ידנית</label>
          <input id="manual" dir="ltr" placeholder="1,6,9,16,22,33,7" />
        </details>
        <div class="actions">
          <button type="button" class="btn" id="import-merge">ייבוא והמשך מאגר</button>
          <button type="button" class="btn secondary" id="import-replace">ייבוא והחלפה</button>
        </div>
        <div id="import-errors"></div>
      </div>
      <div class="card">
        <h2>סדר ועדכון</h2>
        <p>בודק, ממיין, מסיר כפילויות ומחשב מחדש את המדדים על המאגר המעודכן.</p>
        <button type="button" class="btn" id="tidy-run">סדר ועדכן מצב</button>
        <button type="button" class="btn secondary" id="reload-official">טען / רענן מ-file/Lotto.csv</button>
        <button type="button" class="btn danger" id="reset-demo">טען מחדש את המאגר הרשמי</button>
        <div id="tidy-progress" class="hidden">
          <div class="progress"><span id="tidy-bar"></span></div>
          <p id="tidy-step" class="muted"></p>
        </div>
        <div id="tidy-report"></div>
      </div>`;
  },

  backtest() {
    return `
      <h1>בדיקת עבר</h1>
      <div class="disclaimer">Walk-forward: מדדים רק מהעבר של כל נקודה. השוואה לאקראי טהור.</div>
      <div class="card">
        <label>מספר נקודות בדיקה</label>
        <input id="bt-h" type="number" min="5" max="80" value="20" />
        <label>צירופים בכל נקודה</label>
        <input id="bt-t" type="number" min="1" max="10" value="3" />
        <button type="button" class="btn" id="bt-run">הרץ Backtesting</button>
        <div id="bt-busy" class="busy hidden"><span class="spinner"></span> <span id="bt-step">מחשב…</span></div>
        <div id="bt-out"></div>
      </div>`;
  },

  more() {
    const saved = JOKLOB.storage.get().tickets;
    return `
      <h1>עוד</h1>
      <div class="card">
        <button type="button" class="btn" data-go="about">אודות ומדריך מלא</button>
        <p><b>מבנה תיקיות:</b> HTML · CSSS · JSS · README.md</p>
        <h2>שמורים (${saved.length})</h2>
        ${saved.slice(0, 8).map((t) => `<div class="muted" dir="ltr">${t.numbers.join("-")} | ${t.strong}</div>`).join("") || "<p class='muted'>אין</p>"}
        <button type="button" class="btn danger" id="wipe">מחק נתונים מקומיים</button>
      </div>
      <div class="card">
        <h2>זכויות יוצרים</h2>
        <p><b>© 2026 JOKLOB / מיכאל · כל הזכויות שמורות</b></p>
        <p>אין להעתיק, לשכפל, להפיץ או להשתמש בקוד, בעיצוב או במנוע ללא רשות מפורשת בכתב.</p>
      </div>`;
  },

  about() {
    return `
      <h1>אודות — מדריך מלא</h1>
      <p class="engine-title">JOKLOB Research Engine — מנוע המחקר של מיכאל</p>
      <div class="disclaimer">
        <b>קודם כל:</b> האפליקציה חוקרת הגרלות עבר ויוצרת צירופים בשקיפות.
        היא <b>לא</b> יודעת את ההגרלה הבאה ו<b>לא</b> מבטיחה זכייה.
      </div>
      <div class="card">
        <button type="button" class="btn" data-go="home">חזרה למחולל</button>
      </div>
      <details class="guide-box" open><summary>מה זה JOKLOB</summary>
        <p>מערכת מחקר סטטיסטי + אקראיות מבוקרת ללוטו ישראלי: <b>6 מתוך 37</b> ו<b>חזק 1–7</b>.</p>
        <p>המשפט הקבוע: <b>הנתונים עוזרים להבין את העבר — הם אינם מבטיחים את העתיד.</b></p>
      </details>
      <details class="guide-box"><summary>סרגל הניווט</summary>
        <ul>
          <li><b>מחולל</b> — יצירת צירופים.</li>
          <li><b>מחקר</b> — לוח הניתוח לפי קבוצות.</li>
          <li><b>מאגר</b> — מצב, ייבוא ו«סדר ועדכן מצב».</li>
          <li><b>בדיקה</b> — Backtesting מול אקראי.</li>
          <li><b>עוד</b> — שמירות, מחיקה ומדריך.</li>
        </ul>
      </details>
      <details class="guide-box"><summary>המחולל והמודל ההיברידי</summary>
        <p>ברירת מחדל: 2 אש + 2 לחץ + 1 חם + 1 קר, חזק במנוע נפרד, ואקראיות משוקללת בין המועמדים.</p>
        <p>ציון התאמה למודל המחקרי אינו סיכוי זכייה.</p>
      </details>
      <details class="guide-box"><summary>מאגר ותקופות</summary>
        <p>הקובץ הרשמי file/Lotto.csv נטען אוטומטית. 38–49 אינם «קרים» בפורמט 6/37.</p>
      </details>
      <details class="guide-box"><summary>זכויות יוצרים</summary>
        <p><b>© 2026 JOKLOB / מיכאל · כל הזכויות שמורות.</b></p>
      </details>`;
  },
};
