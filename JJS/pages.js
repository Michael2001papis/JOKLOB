window.JOKLOB = window.JOKLOB || {};

JOKLOB.pages = {
  home() {
    const t = (k) => JOKLOB.i18n.t(k);
    return `
      <h1>${t("subtitle")}</h1>
      <p>${t("note")}</p>
      <div class="grid">
        <button class="tile" data-go="research"><b>${t("newResearch")}</b><span>שפה טבעית → חישוב</span></button>
        <button class="tile" data-go="projects"><b>${t("openProject")}</b><span>שמירה מקומית</span></button>
        <button class="tile" data-go="math"><b>${t("newCalc")}</b><span>math.js</span></button>
        <button class="tile" data-go="numbers"><b>${t("numberLab")}</b><span>בלי הימורים</span></button>
        <button class="tile" data-go="physics"><b>${t("physicsLab")}</b><span>סימולציה + הנחות</span></button>
        <button class="tile" data-go="axioms"><b>${t("axiomLab")}</b><span>עולם עם חוקים</span></button>
        <button class="tile" data-go="between"><b>${t("between")}</b><span>בין 1 ל-2</span></button>
        <button class="tile" data-go="docs"><b>מסמכים</b><span>הערות מקומיות</span></button>
        <button class="tile" data-go="export"><b>${t("makePdf")}</b><span>הדפסה / שמירה</span></button>
        <button class="tile" data-go="history"><b>${t("history")}</b><span>פעילות</span></button>
      </div>`;
  },

  labs() {
    return `
      <h1>${JOKLOB.i18n.t("labs")}</h1>
      <div class="grid">
        <button class="tile" data-go="math"><b>מתמטיקה</b><span>simplify · solve · derivative</span></button>
        <button class="tile" data-go="numbers"><b>מספרים</b><span>סדרות וסטטיסטיקה</span></button>
        <button class="tile" data-go="physics"><b>פיזיקה</b><span>קליע עד קוונטים</span></button>
        <button class="tile" data-go="axioms"><b>אקסיומות</b><span>יקום סופי</span></button>
        <button class="tile" data-go="between"><b>בין מספרים</b><span>צפיפות</span></button>
        <button class="tile" data-go="research"><b>מחקר</b><span>NL pipeline</span></button>
      </div>`;
  },

  projects() {
    const data = JOKLOB.storage.get();
    const list = data.projects.map((p) => `
      <button class="list-item" data-open-project="${p.id}">
        <b>${JOKLOB.ui.escape(p.title)}</b>
        <div class="muted">${JOKLOB.ui.escape(p.description || "")}</div>
      </button>`).join("") || `<p class="muted">אין פרויקטים עדיין.</p>`;
    return `
      <h1>פרויקטים</h1>
      <label>כותרת</label>
      <input id="proj-title" placeholder="שם המחקר" />
      <label>תיאור</label>
      <textarea id="proj-desc"></textarea>
      <button class="btn" id="proj-add">פרויקט חדש</button>
      <div style="margin-top:12px">${list}</div>`;
  },

  research() {
    const draft = JOKLOB.storage.get().drafts.research || "פתור: x^2 - 5*x + 6 = 0";
    return `
      <h1>מחקר חדש</h1>
      <p>כתבו בעברית או באנגלית. המערכת תחלץ ביטוי, תציג הנחות, ותחשב ב-math.js.</p>
      <textarea id="research-text">${JOKLOB.ui.escape(draft)}</textarea>
      <button class="btn" id="research-run">נתח וחשב</button>
      <div id="research-out"></div>`;
  },

  math() {
    return `
      <h1>חישוב מתמטי</h1>
      <label>Intent</label>
      <select id="math-intent">
        <option value="solve">solve</option>
        <option value="simplify">simplify</option>
        <option value="derivative">derivative</option>
        <option value="integral">integral</option>
        <option value="evaluate">evaluate</option>
      </select>
      <label>Expression</label>
      <textarea id="math-expr" dir="ltr">x^2 - 5*x + 6 = 0</textarea>
      <button class="btn" id="math-run">חשב</button>
      <div id="math-out"></div>`;
  },

  numbers() {
    return `
      <h1>מעבדת מספרים</h1>
      <p>אין ניבוי הגרלות. טווח 1–37 הוא קבוצה מופשטת בלבד.</p>
      <textarea id="num-raw" dir="ltr">1, 1, 2, 3, 5, 8</textarea>
      <label>הפוך למספר אחד</label>
      <select id="num-method">
        <option>sum</option><option>product</option><option>mean</option><option>rms</option>
      </select>
      <button class="btn" id="num-run">נתח</button>
      <div id="num-out"></div>`;
  },

  physics() {
    const opts = JOKLOB.physicsLab.scenarios.map((s) =>
      `<option value="${s.id}">${JOKLOB.i18n.lang === "en" ? s.en : s.he}</option>`).join("");
    return `
      <h1>מעבדת פיזיקה</h1>
      <select id="phys-id">${opts}</select>
      <label>פרמטרים (JSON)</label>
      <textarea id="phys-params" dir="ltr">{"v0":20,"angle_deg":45,"g":9.80665}</textarea>
      <label style="display:flex;gap:8px;align-items:center">
        <input type="checkbox" id="phys-cancel" /> סימולציית g=0 (מודל בלבד)
      </label>
      <button class="btn" id="phys-run">הרץ סימולציה</button>
      <canvas class="chart" id="phys-chart"></canvas>
      <div id="phys-out"></div>`;
  },

  axioms() {
    return `
      <h1>מעבדת אקסיומות</h1>
      <p>יצירת עולם מתמטי בעל חוקים חדשים ומוגדרים.</p>
      <label>אובייקטים</label>
      <input id="ax-obj" dir="ltr" value="0,1,2,3" />
      <label>פעולה</label>
      <select id="ax-op"><option>+</option><option>*</option><option>max</option><option>min</option><option>xor</option></select>
      <label>אקסיומות</label>
      <textarea id="ax-text">commutative
associative</textarea>
      <button class="btn" id="ax-run">בדוק</button>
      <div id="ax-out"></div>`;
  },

  between() {
    return `
      <h1>בין מספרים</h1>
      <div class="row">
        <input id="bt-a" dir="ltr" value="1" />
        <input id="bt-b" dir="ltr" value="2" />
      </div>
      <label>Zoom</label>
      <input type="range" id="bt-zoom" min="1" max="80" value="1" />
      <button class="btn" id="bt-run">חקור</button>
      <svg class="number-line" id="bt-svg" viewBox="0 0 320 90"></svg>
      <div id="bt-out"></div>`;
  },

  docs() {
    const docs = JOKLOB.storage.get().docs;
    const list = docs.map((d) => `
      <div class="list-item"><b>${JOKLOB.ui.escape(d.title)}</b><div class="muted">${JOKLOB.ui.escape(d.notes).slice(0, 160)}</div></div>`).join("") || `<p class="muted">אין מסמכים.</p>`;
    return `
      <h1>מסמכים</h1>
      <p>שמירה מקומית במכשיר. העלאת PDF לשרת דורשת backend נפרד — כאן ניתן לשמור הערות וטקסט.</p>
      <label>כותרת</label>
      <input id="doc-title" />
      <label>תוכן / הערות</label>
      <textarea id="doc-notes"></textarea>
      <button class="btn" id="doc-add">שמור מסמך</button>
      <div>${list}</div>`;
  },

  export() {
    return `
      <h1>יצוא דוח</h1>
      <p>הדפסה לדפדפן / שמירה כ-PDF ממסך ההדפסה. נוסחאות מוצגות כטקסט/LaTeX.</p>
      <label>כותרת</label>
      <input id="ex-title" value="דוח מחקר JOKLOB" />
      <label>שאלת מחקר</label>
      <textarea id="ex-q"></textarea>
      <label>תוצאות</label>
      <textarea id="ex-r"></textarea>
      <button class="btn" id="ex-print">הדפס / שמור PDF</button>`;
  },

  history() {
    const rows = JOKLOB.storage.get().history.map((h) => `
      <div class="list-item"><b>${JOKLOB.ui.escape(h.action)}</b>
        <div>${JOKLOB.ui.escape(h.detail || "")}</div>
        <div class="muted">${JOKLOB.ui.escape(h.at || "")}</div>
      </div>`).join("") || `<p class="muted">אין היסטוריה.</p>`;
    return `<h1>היסטוריה</h1>${rows}`;
  },

  more() {
    return `
      <h1>הגדרות</h1>
      <div class="row">
        <button class="btn secondary" id="lang-he">עברית</button>
        <button class="btn secondary" id="lang-en">English</button>
      </div>
      <div class="row">
        <button class="btn secondary" id="theme-dark">כהה</button>
        <button class="btn secondary" id="theme-light">בהיר</button>
      </div>
      <div class="install-banner">
        <b>התקנה ב-Galaxy S22</b>
        <p>Chrome → תפריט → Add to Home screen. האתר הוא PWA סטטי.</p>
      </div>
      <button class="btn" data-go="history">היסטוריה</button>
      <button class="btn secondary" data-go="export">יצוא דוח</button>
      <button class="btn danger" id="wipe-data">מחק נתונים מקומיים</button>`;
  },
};
