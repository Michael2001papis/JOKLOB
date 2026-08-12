/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};
JOKLOB.copyright = {
  owner: "JOKLOB / מיכאל",
  year: 2026,
  notice: "Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved. כל הזכויות שמורות.",
};

JOKLOB.pages = {
  home() {
    const methods = Object.entries(JOKLOB.generator.METHODS)
      .map(([id, m]) => `<option value="${id}">${m.he}</option>`)
      .join("");
    const st = JOKLOB.storage.get();
    const periods = JOKLOB.data.periodOptions().map((p) =>
      `<option value="${p.id}"${p.id === (st.period || "format37") ? " selected" : ""}>${p.he}</option>`
    ).join("");
    return `
      <h1>מחולל מחקרי</h1>
      <p class="engine-title">JOKLOB Research Engine — מנוע המחקר של מיכאל</p>
      <div class="disclaimer">
        <b>גילוי נאות:</b> ציון התאמה למודל ≠ סיכוי זכייה.
        אין מספר בטוח ואין זכייה מובטחת.
      </div>
      <div class="card">
        <label>סוג</label>
        <div class="seg" id="mode-seg">
          <button type="button" data-mode="regular" class="on">לוטו רגיל</button>
          <button type="button" data-mode="double">דאבל לוטו</button>
        </div>
        <label>מודל</label>
        <select id="method">${methods}</select>
        <label>תקופת מחקר</label>
        <select id="period">${periods}</select>
        <label>מספר צירופים</label>
        <input id="count" type="number" min="1" max="20" value="1" />
        <label>שכבה ניסיונית עולמית</label>
        <select id="exp-mode">
          <option value="seed_only" ${st.experimentalMode === "seed_only" ? "selected" : ""}>Seed בלבד (לא משפיע על ציון סטטיסטי)</option>
          <option value="weighted" ${st.experimentalMode === "weighted" ? "selected" : ""}>משקל ניסיוני מוגבל (≤10%)</option>
          <option value="off">כבוי</option>
        </select>
        <label>Seed (ריק = חדש)</label>
        <input id="seed" dir="ltr" placeholder="לשחזור Exact" />
        <button type="button" class="btn big" id="generate">צור מספרים</button>
      </div>
      <div id="results"></div>
      <div class="actions" id="batch-actions" style="display:none">
        <button type="button" class="btn secondary" id="pdf-btn">ייצוא דוח PDF</button>
        <button type="button" class="btn secondary" id="alt-btn">צירוף חלופי</button>
      </div>`;
  },

  research() {
    return `
      <h1>לוח מחקר</h1>
      <p>מסכי המחקר — חישוב מחדש על המאגר העדכני + השוואה לצילום 08.08.2026.</p>
      <div class="grid-links">
        ${[
          ["about", "אודות / מדריך"],
          ["r-overview", "לוח ראשי"],
          ["upload", "העלאת מאגר"],
          ["r-period", "בחירת תקופה"],
          ["r-hot", "חמים"],
          ["r-cold", "קרים"],
          ["r-quiet", "שקטים"],
          ["r-fire", "מדד אש"],
          ["r-pressure", "מדד לחץ"],
          ["r-pairs", "זוגות ושלשות"],
          ["r-seq", "רצפים"],
          ["r-parity", "זוגי / אי־זוגי"],
          ["r-ranges", "פיזור טווחים"],
          ["r-shadow", "צל הגרלה"],
          ["r-strong", "המספר החזק"],
          ["home", "מחולל היברידי"],
          ["backtest", "בדיקת עבר"],
          ["r-compare", "השוואת מודלים"],
          ["r-history", "היסטוריית חישובים"],
          ["r-snapshot", "צילום מיכאל"],
          ["r-pdf", "ייצוא דוח PDF"],
        ]
          .map(([id, label]) => `<button type="button" class="tile" data-go="${id}"><b>${label}</b></button>`)
          .join("")}
      </div>`;
  },

  "r-overview"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const r = JOKLOB.analyze.fullReport(draws);
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>לוח מחקר ראשי</h1>
      <div class="card">
        <p>גודל מדגם פעיל: <b>${r.sampleSize}</b> · סוג: <span class="chip">חישוב מתמטי</span></p>
        <p>ממוצע סכום מחושב: <b>${r.shadow.mean.toFixed(1)}</b> · חציון: <b>${r.shadow.median}</b></p>
        <p>טווח אמצעי (P25–P75): <b>${r.shadow.p25}–${r.shadow.p75}</b></p>
        <p>ייחוס מחקר מקורי: סכום ~${JOKLOB.snapshot.shadowRef.sumCenter}, אזור ${JOKLOB.snapshot.shadowRef.sumBand.join("–")}</p>
        <p>חמים (מחושב): ${JOKLOB.ui.numList(r.classes.hot.slice(0, 12))}</p>
        <p>קרים (מחושב): ${JOKLOB.ui.numList(r.classes.cold.slice(0, 12))}</p>
        <p>אש (מחושב): ${JOKLOB.ui.numList(r.classes.fireTop)}</p>
        <p>לחץ (מחושב): ${JOKLOB.ui.numList(r.classes.pressureTop)}</p>
      </div>`;
  },

  "r-hot"() {
    return this._classPage("חמים", "hot", JOKLOB.snapshot.hot);
  },
  "r-cold"() {
    return this._classPage("קרים", "cold", JOKLOB.snapshot.cold);
  },
  "r-quiet"() {
    return this._classPage("שקטים", "quiet", JOKLOB.snapshot.quiet);
  },
  _classPage(title, key, snap) {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const r = JOKLOB.analyze.classifyNumbers(draws);
    const list = r[key] || [];
    const cmp = r.cmp.enriched.filter((x) => list.includes(x.n));
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>מספרים ${title}</h1>
      <div class="card">
        <p><span class="chip">חישוב מתמטי</span> מדגם ${r.cmp.sampleSize} · חלון אחרון ${r.cmp.recentSize}</p>
        <p>מחושב כעת: ${JOKLOB.ui.numList(list)}</p>
        <p>צילום 08.08.2026: ${JOKLOB.ui.numList(snap)}</p>
        <pre>${JOKLOB.ui.esc(JSON.stringify(cmp.slice(0, 12).map((x) => ({ n: x.n, count: x.count, rate: +x.rate.toFixed(4), since: x.since, rankHistoric: x.rankHistoric, rankRecent: x.rankRecent })), null, 2))}</pre>
      </div>`;
  },

  "r-fire"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const fire = JOKLOB.analyze.fireIndex(draws);
    const rows = fire.list
      .slice(0, 15)
      .map((x) => `<tr><td>${x.n}</td><td>${x.score}</td><td>${(x.parts.recent * 100).toFixed(0)}%</td><td>${(x.parts.historic * 100).toFixed(0)}%</td></tr>`)
      .join("");
    const w = fire.weights;
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>מדד אש</h1>
      <div class="card">
        <p>ברירת מחדל: 40% אחרון · 30% היסטורי · 20% מגמה · 10% יציבות</p>
        <div class="weight-row"><label>אחרון</label><input type="range" min="0" max="1" step="0.05" id="fw-recent" value="${w.recent}" /></div>
        <div class="weight-row"><label>היסטורי</label><input type="range" min="0" max="1" step="0.05" id="fw-historic" value="${w.historic}" /></div>
        <div class="weight-row"><label>מגמה</label><input type="range" min="0" max="1" step="0.05" id="fw-trend" value="${w.trend}" /></div>
        <div class="weight-row"><label>יציבות</label><input type="range" min="0" max="1" step="0.05" id="fw-stability" value="${w.stability}" /></div>
        <button type="button" class="btn" id="save-fire-w">שמור משקלים וחשב</button>
        <p>צילום מקורי: ${JOKLOB.ui.numList(JOKLOB.snapshot.fireThen)}</p>
        <table class="tbl"><thead><tr><th>#</th><th>אש</th><th>אחרון</th><th>היסטורי</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  },

  "r-pressure"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const p = JOKLOB.analyze.pressureIndex(draws);
    const rows = p.list
      .slice(0, 15)
      .map((x) => `<tr><td>${x.n}</td><td>${x.score}</td><td>${x.since}</td><td>${x.quietPercentile.toFixed(0)}</td></tr>`)
      .join("");
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>מדד לחץ</h1>
      <div class="disclaimer warn-box"><b>אזהרה:</b> ${JOKLOB.ui.esc(p.warning)}</div>
      <div class="card">
        <p>צילום מקורי: ${JOKLOB.ui.numList(JOKLOB.snapshot.pressureThen)}</p>
        <table class="tbl"><thead><tr><th>#</th><th>לחץ</th><th>שקט</th><th>אחוזון</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  },

  "r-pairs"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const pt = JOKLOB.analyze.pairsAndTriples(draws);
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>זוגות ושלשות</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(pt.note)}</p>
        <h2>זוגות מובילים (מחושב)</h2>
        <pre>${JOKLOB.ui.esc(JSON.stringify(pt.pairs.slice(0, 15), null, 2))}</pre>
        <h2>שלשות מובילות (מחושב)</h2>
        <pre>${JOKLOB.ui.esc(JSON.stringify(pt.triples.slice(0, 12), null, 2))}</pre>
        <h2>צילום מחקר מקורי — זוגות</h2>
        <p>${JOKLOB.snapshot.keyPairs.map((p) => p.join("-")).join(" · ")}</p>
        <h2>צילום — שלשות</h2>
        <p>${JOKLOB.snapshot.keyTriples.map((p) => p.join("-")).join(" · ")}</p>
      </div>`;
  },

  "r-seq"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const s = JOKLOB.analyze.sequences(draws);
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>רצפים</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(s.note)}</p>
        <p>ללא רצף: ${s.none} · רצף זוגי: ${s.two} · 3+: ${s.threePlus}</p>
        <pre>${JOKLOB.ui.esc(JSON.stringify(s.top, null, 2))}</pre>
        <p>צילום: ${JOKLOB.snapshot.keySequences.map((x) => x.join("-")).join(" · ")}</p>
      </div>`;
  },

  "r-shadow"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const sh = JOKLOB.analyze.shadowStats(draws);
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>צל הגרלה</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(sh.note)}</p>
        <p>ממוצע סכום: <b>${sh.mean.toFixed(2)}</b> · חציון: <b>${sh.median}</b></p>
        <p>אחוזונים: P10=${sh.p10} · P25=${sh.p25} · P75=${sh.p75} · P90=${sh.p90}</p>
        <p>ייחוס מחקר: מרכז ${sh.researchRef.sumCenter}, אזור ${sh.researchRef.sumBand.join("–")}, מבנה ${sh.researchRef.evenOdd.join(":")}</p>
        <p>חלוקת טווחים: 1–10 · 11–20 · 21–30 · 31–37 (7 מספרים בלבד בטווח האחרון)</p>
      </div>`;
  },

  "r-strong"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const s = JOKLOB.analyze.strongAnalysis(draws);
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>מנוע המספר החזק</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(s.note)}</p>
        <p>צילום: ${s.snapshotStrong.join(", ")}</p>
        <pre>${JOKLOB.ui.esc(JSON.stringify(s.list, null, 2))}</pre>
      </div>`;
  },

  "r-snapshot"() {
    const s = JOKLOB.snapshot;
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>${s.nameHe}</h1>
      <div class="card">
        <p><span class="chip">נתון היסטורי / צילום מצב</span></p>
        <p>${JOKLOB.ui.esc(s.disclaimer)}</p>
        <p>כ־${s.drawsInArchiveApprox} הגרלות · אחרונה #${s.lastDrawNumber} בתאריך ${s.lastDrawDate}</p>
        <p>תוצאה אחרונה: ${JOKLOB.ui.numList(s.lastResult.numbers)} | חזק ${s.lastResult.strong}</p>
        <p>שישיית בסיס: ${JOKLOB.ui.numList(s.baseSix)}</p>
        <p>חמים: ${JOKLOB.ui.numList(s.hot)}</p>
        <p>קרים: ${JOKLOB.ui.numList(s.cold)}</p>
        <p>שקטים: ${JOKLOB.ui.numList(s.quiet)}</p>
      </div>`;
  },

  "r-history"() {
    const h = JOKLOB.storage.get().history;
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>היסטוריית חישובים</h1>
      <div class="card">
        ${h.map((x) => `<div class="list-item"><b dir="ltr">${JOKLOB.ui.esc(x.seed)}</b><div class="muted">${x.method} · ${x.n} · ${new Date(x.at).toLocaleString("he-IL")}</div></div>`).join("") || "<p class='muted'>אין עדיין</p>"}
      </div>`;
  },

  "r-period"() {
    const st = JOKLOB.storage.get();
    let custom = { from: "", to: "" };
    try {
      custom = JSON.parse(localStorage.getItem("joklob_custom_period") || "{}");
    } catch {
      /* ignore */
    }
    const opts = JOKLOB.data
      .periodOptions()
      .map(
        (p) =>
          `<option value="${p.id}"${p.id === (st.period || "format37") ? " selected" : ""}>${p.he}</option>`
      )
      .join("");
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>בחירת תקופה ופורמט</h1>
      <div class="card">
        <p>אין לערבב אוטומטית בין פורמטים. ברירת המחדל ליצירת צירופים: 6 מתוך 37 בלבד.</p>
        <p class="muted">מספרים 38–49 אינם “קרים” בפורמט הנוכחי — הם פשוט לא משתתפים בו.</p>
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
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const sh = JOKLOB.analyze.shadowStats(draws);
    const rows = sh.evenOddTop
      .map(
        (x) =>
          `<tr><td>${x.pattern}</td><td>${x.count}</td><td>${(x.rate * 100).toFixed(1)}%</td></tr>`
      )
      .join("");
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>זוגי ואי־זוגי</h1>
      <div class="card">
        <p><span class="chip">חישוב מתמטי</span> מדגם ${sh.sampleSize}</p>
        <p>ייחוס מחקר: מבנה נפוץ 3:3 (זוגי:אי־זוגי) — העדפה, לא חובה מוחלטת.</p>
        <table class="tbl"><thead><tr><th>מבנה</th><th>הופעות</th><th>שיעור</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  },

  "r-ranges"() {
    const { draws } = JOKLOB.generator.getDraws(JOKLOB.storage.get().period || "format37");
    const sh = JOKLOB.analyze.shadowStats(draws);
    const labels = ["1–10", "11–20", "21–30", "31–37"];
    const avgRows = labels
      .map(
        (l, i) =>
          `<tr><td>${l}</td><td>${sh.bandAvg[i]}</td><td>${sh.bandDensityAvg[i]}</td></tr>`
      )
      .join("");
    const patRows = sh.bandTop
      .map(
        (x) =>
          `<tr><td>${x.pattern}</td><td>${x.count}</td><td>${(x.rate * 100).toFixed(1)}%</td></tr>`
      )
      .join("");
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>פיזור טווחים</h1>
      <div class="card">
        <p>${JOKLOB.ui.esc(sh.note)}</p>
        <p>ייחוס מחקר: דפוסים כמו 2-2-1-1 או 1-2-2-1.</p>
        <h2>ממוצע למספרים בטווח</h2>
        <table class="tbl"><thead><tr><th>טווח</th><th>ממוצע גולמי</th><th>צפיפות מנורמלת</th></tr></thead><tbody>${avgRows}</tbody></table>
        <h2>דפוסי פיזור נפוצים</h2>
        <table class="tbl"><thead><tr><th>דפוס</th><th>הופעות</th><th>שיעור</th></tr></thead><tbody>${patRows}</tbody></table>
      </div>`;
  },

  "r-compare"() {
    const cmp = JOKLOB.storage.get().compare || [];
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>השוואת מודלים</h1>
      <div class="card">
        <p>מריץ את כל המודלים על אותו Seed ומדגם — להשוואת מבנה וציון התאמה (לא סיכוי זכייה).</p>
        <label>Seed משותף</label>
        <input id="cmp-seed" dir="ltr" placeholder="ריק = Seed חדש" />
        <button type="button" class="btn" id="cmp-run">השווה מודלים</button>
        <div id="cmp-out"></div>
        <h2>שמורות אחרונות</h2>
        <pre>${JOKLOB.ui.esc(JSON.stringify(cmp.slice(0, 5), null, 2))}</pre>
      </div>`;
  },

  "r-pdf"() {
    return `
      <button type="button" class="btn secondary" data-go="research">← חזרה</button>
      <h1>ייצוא דוח PDF</h1>
      <div class="card">
        <p>מייצא את אצוות הצירופים האחרונה (או מחולל חדש) כדוח להדפסה/PDF.</p>
        <button type="button" class="btn" id="pdf-last">ייצא אצווה אחרונה</button>
        <button type="button" class="btn secondary" data-go="home">עבור למחולל</button>
        <div id="pdf-status" class="muted"></div>
      </div>`;
  },

  upload() {
    const db = JOKLOB.data.load();
    return `
      <h1>מאגר הגרלות</h1>
      <div class="card">
        <p>גרסה פעילה: <b>${JOKLOB.ui.esc(db.sourceLabel || "—")}</b></p>
        <p>הגרלות במאגר: <b>${db.draws.length}</b> · עודכן: ${db.updatedAt ? new Date(db.updatedAt).toLocaleString("he-IL") : "—"}</p>
        ${db.isDemo ? `<div class="disclaimer">מוצג מאגר הדגמה סינתטי. העלו CSV/Excel אמיתי למחקר.</div>` : ""}
        <label>CSV / טקסט (draw,date,n1..n6,strong או n1..n6,strong)</label>
        <textarea id="csv" dir="ltr"></textarea>
        <label>Excel (.xlsx)</label>
        <input type="file" id="xlsx" accept=".xlsx,.xls" />
        <label>PDF</label>
        <input type="file" id="pdf" accept=".pdf" />
        <p class="muted">PDF: אין חילוץ אוטומטי אמין בדפדפן — המירו ל-CSV/Excel. מסומן כמגבלה שקופה.</p>
        <label>הקלדה ידנית (שורה אחת)</label>
        <input id="manual" dir="ltr" placeholder="1,6,9,16,22,33,7" />
        <div class="actions">
          <button type="button" class="btn" id="import-merge">ייבוא והמשך מאגר</button>
          <button type="button" class="btn secondary" id="import-replace">ייבוא והחלפה</button>
        </div>
        <button type="button" class="btn danger" id="reset-demo">איפוס להדגמה</button>
        <div id="import-errors"></div>
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
        <div id="bt-out"></div>
      </div>`;
  },

  more() {
    const saved = JOKLOB.storage.get().tickets;
    return `
      <h1>עוד</h1>
      <div class="card">
        <p><b>מבנה תיקיות:</b> HTML · CSSS · JSS · README.md</p>
        <div class="row">
          <button type="button" class="btn secondary" id="theme-dark">כהה</button>
          <button type="button" class="btn secondary" id="theme-light">בהיר</button>
        </div>
        <h2>שמורים (${saved.length})</h2>
        ${saved.slice(0, 8).map((t) => `<div class="muted" dir="ltr">${t.numbers.join("-")} | ${t.strong}</div>`).join("") || "<p class='muted'>אין</p>"}
        <button type="button" class="btn danger" id="wipe">מחק נתונים מקומיים</button>
      </div>
      <div class="card">
        <h2>זכויות יוצרים</h2>
        <p><b>© 2026 JOKLOB / מיכאל · כל הזכויות שמורות</b></p>
        <p>JOKLOB Research Engine — מנוע המחקר של מיכאל הוא יצירה מוגנת. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד, בעיצוב או במנוע ללא רשות מפורשת בכתב.</p>
      </div>`;
  },
};
