window.JOKLOB = window.JOKLOB || {};

JOKLOB.pages = {
  home() {
    const methods = Object.entries(JOKLOB.generator.METHODS)
      .map(([id, m]) => `<option value="${id}">${m.he}</option>`)
      .join("");
    return `
      <h1>יצירת מספרי לוטו</h1>
      <div class="disclaimer">
        <b>גילוי נאות:</b> בהגרלה הוגנת לכל צירוף חוקי אותה הסתברות.
        המערכת אינה מנבאת זכייה ואינה מציגה «סיכויים משופרים».
      </div>
      <div class="card">
        <label>סוג משחק</label>
        <div class="seg" id="mode-seg">
          <button type="button" data-mode="regular" class="on">לוטו רגיל</button>
          <button type="button" data-mode="double">דאבל לוטו</button>
        </div>
        <label>שיטת חישוב</label>
        <select id="method">${methods}</select>
        <label>מספר צירופים</label>
        <input id="count" type="number" min="1" max="20" value="1" />
        <label>Seed (אופציונלי — לשחזור Exact)</label>
        <input id="seed" dir="ltr" placeholder="ריק = Seed חדש מאובטח" />
        <button type="button" class="btn big" id="generate">צור מספרים</button>
      </div>
      <div id="exp-note" class="disclaimer hidden">
        <b>מצב ניסיוני:</b> שילוב תאריך/שעה (ומדדים עולמיים מדומים) מסומן כמודל בלבד —
        אין הוכחה שהוא משפיע על תוצאות הגרלה אקראית.
      </div>
      <div id="results"></div>
      <div class="actions" id="batch-actions" style="display:none">
        <button type="button" class="btn secondary" id="pdf-btn">ייצוא דוח PDF</button>
        <button type="button" class="btn secondary" id="regen-btn">צירוף חלופי</button>
      </div>`;
  },

  weights() {
    const w = JOKLOB.metrics.loadWeights();
    const rows = Object.keys(JOKLOB.metrics.defaults).map((k) => `
      <div class="weight-row">
        <div>
          <label>${JOKLOB.metrics.labels[k] || k}</label>
          <input type="range" min="0" max="1.5" step="0.05" data-w="${k}" value="${w[k]}" />
        </div>
        <div class="muted" data-wv="${k}">${Number(w[k]).toFixed(2)}</div>
      </div>`).join("");
    return `
      <h1>משקלי פרמטרים</h1>
      <p>המשקלים משפיעים על דירוג מועמדים בשיטות המחושבות. באקראי לחלוטין הם אינם בשימוש.</p>
      <div class="card">${rows}
        <button type="button" class="btn" id="save-weights">שמור משקלים</button>
        <button type="button" class="btn secondary" id="reset-weights">איפוס לברירת מחדל</button>
      </div>`;
  },

  saved() {
    const d = JOKLOB.storage.get();
    const list = d.tickets.map((t) => `
      <button type="button" class="list-item" data-show="${JOKLOB.ui.esc(t.calcId)}">
        <b dir="ltr">${t.numbers.join("-")} | ${t.strong}</b>
        <div class="muted">${JOKLOB.ui.esc(t.methodLabel)} · ${new Date(t.createdAt).toLocaleString("he-IL")}</div>
      </button>`).join("") || `<p class="muted">אין צירופים שמורים.</p>`;
    const compare = d.compare.length
      ? d.compare.map((t) => JOKLOB.ui.ticketCard(t)).join("")
      : `<p class="muted">בחרו «השוואה» בכרטיס צירוף.</p>`;
    return `
      <h1>שמורים והשוואה</h1>
      <h2>השוואה</h2>${compare}
      <h2>היסטוריית שמירות</h2>${list}
      <div id="saved-detail"></div>`;
  },

  data() {
    const draws = JOKLOB.history.load();
    const stats = JOKLOB.history.analyze(draws);
    return `
      <h1>נתוני הגרלות</h1>
      <div class="disclaimer"><b>שים לב:</b> ${JOKLOB.ui.esc(
        stats.syntheticShare > 0.5 ? JOKLOB.history.DEMO_NOTE : "מוצגים נתונים שהוזנו."
      )}</div>
      <div class="card">
        <p>הגרלות במאגר: <b>${stats.totalDraws}</b> · ממוצע סכום: <b>${stats.avgSum.toFixed(1)}</b></p>
        <p>חמים: <span dir="ltr">${stats.hot.join(", ")}</span></p>
        <p>קרים: <span dir="ltr">${stats.cold.join(", ")}</span></p>
        <label>הדבקת CSV (n1,n2,n3,n4,n5,n6,strong בכל שורה)</label>
        <textarea id="csv" dir="ltr" placeholder="3,8,14,21,29,35,4"></textarea>
        <button type="button" class="btn" id="import-csv">ייבוא והחלפה</button>
        <button type="button" class="btn secondary" id="reset-demo">איפוס למאגר הדגמה</button>
      </div>`;
  },

  more() {
    return `
      <h1>עוד</h1>
      <div class="disclaimer">
        <b>מטרת JOKLOB:</b> בחירה אקראית־מחושבת של 6 מספרים (1–37) + מספר חזק (1–7),
        עם שקיפות מלאה. לא מחולל אקראי פשוט — וגם לא הבטחת זכייה.
      </div>
      <div class="row">
        <button type="button" class="btn secondary" id="theme-dark">כהה</button>
        <button type="button" class="btn secondary" id="theme-light">בהיר</button>
      </div>
      <div class="card">
        <p>התקנה ב-Galaxy S22: Chrome → Add to Home screen.</p>
        <button type="button" class="btn danger" id="wipe">מחק נתונים מקומיים</button>
      </div>`;
  },
};
