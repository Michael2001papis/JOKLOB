/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

JOKLOB.data = {
  KEY: "joklob_research_db_v2",
  FORMAT_37: "6/37+strong7",
  FORMAT_49: "legacy_to_49",
  OFFICIAL_URL: "/file/Lotto.csv",
  OFFICIAL_ID: "file-lotto-csv",

  emptyDb() {
    return {
      version: 1,
      updatedAt: null,
      sourceLabel: "",
      draws: [],
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db && Array.isArray(db.draws) && db.draws.length) return db;
      }
    } catch (_) {}
    return {
      version: 0,
      updatedAt: null,
      sourceLabel: "טוען מאגר רשמי מ-file/Lotto.csv…",
      draws: [],
      isDemo: false,
      loadingOfficial: true,
    };
  },

  save(db) {
    localStorage.setItem(this.KEY, JSON.stringify(db));
  },

  makeDemoFormat37(n) {
    const rand = JOKLOB.rng.fromSeed("joklob-demo-6-37-v2");
    const out = [];
    const start = new Date("2018-01-01").getTime();
    for (let i = 0; i < n; i++) {
      const nums = JOKLOB.rng.sampleDistinct(1, 37, 6, rand);
      out.push({
        drawNumber: 3000 + i,
        date: new Date(start + i * 86400000 * 2).toISOString().slice(0, 10),
        numbers: nums,
        strong: JOKLOB.rng.int(1, 7, rand),
        format: this.FORMAT_37,
        source: "demo-synthetic",
        uploadedAt: new Date().toISOString(),
        synthetic: true,
      });
    }
    return out;
  },

  detectFormat(numbers, strong) {
    const nums = (numbers || []).map(Number);
    const max = Math.max(...nums, 0);
    const s = Number(strong);
    if (max > 37 && max <= 49) return this.FORMAT_49;
    if (max > 49) return "unknown";
    if (Number.isInteger(s) && s >= 1 && s <= 7) return this.FORMAT_37;
    return this.FORMAT_49;
  },

  parseDate(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
  },

  splitCsvLine(line) {
    return String(line)
      .split(",")
      .map((x) => x.trim())
      .filter((x, i, arr) => x !== "" || i < arr.length - 1);
  },

  validateDraw(row) {
    const errors = [];
    const nums = (row.numbers || []).map(Number);
    if (nums.length !== 6) errors.push("חייבים בדיוק 6 מספרים ראשיים");
    if (new Set(nums).size !== nums.length) errors.push("מספר כפול באותה הגרלה");
    const fmt = row.format || this.detectFormat(nums, row.strong);
    const maxAllowed = fmt === this.FORMAT_49 ? 49 : 37;
    nums.forEach((n) => {
      if (!Number.isInteger(n) || n < 1 || n > maxAllowed) {
        errors.push(`מספר מחוץ לטווח: ${n} (מקסימום ${maxAllowed} לפורמט)`);
      }
    });
    const strong = Number(row.strong);
    if (fmt === this.FORMAT_37) {
      if (!Number.isInteger(strong) || strong < 1 || strong > 7) {
        errors.push("מספר חזק חייב להיות 1–7");
      }
    }
    if (!row.date) errors.push("חסר תאריך");
    return { ok: errors.length === 0, errors, format: fmt };
  },

  parseCsv(text) {
    const rows = [];
    const errors = [];
    String(text).split(/\r?\n/).forEach((line, idx) => {
      const t = line.trim().replace(/,+$/, "");
      if (!t || t.startsWith("#")) return;
      if (/הגרלה|תאריך|חזק/.test(t) && !/^\d/.test(t)) return;
      if (/[a-zA-Zא-ת]/.test(t) && !/\d/.test(t)) return;

      const cells = this.splitCsvLine(t);
      let drawNumber = null;
      let date = null;
      let nums = [];
      let strong = null;
      let winnersLotto = null;
      let winnersDouble = null;

      const dateIdx = cells.findIndex((c) => this.parseDate(c));
      if (dateIdx >= 0) {
        date = this.parseDate(cells[dateIdx]);
        const before = cells.slice(0, dateIdx).map(Number).filter(Number.isFinite);
        if (before.length) drawNumber = before[0];
        const after = cells.slice(dateIdx + 1).map((c) => Number(String(c).replace(/^0+(?=\d)/, "")));
        const afterNums = after.filter(Number.isFinite);
        nums = afterNums.slice(0, 6);
        strong = afterNums.length > 6 ? afterNums[6] : null;
        winnersLotto = afterNums.length > 7 ? afterNums[7] : null;
        winnersDouble = afterNums.length > 8 ? afterNums[8] : null;
      } else {
        const parts = t.split(/[\s,;|\t]+/).map((x) => x.trim()).filter(Boolean);
        const numsOnly = parts.map(Number).filter((x) => Number.isFinite(x));
        if (numsOnly.length >= 8) {
          drawNumber = numsOnly[0];
          nums = numsOnly.slice(1, 7);
          strong = numsOnly[7];
        } else if (numsOnly.length >= 7) {
          nums = numsOnly.slice(0, 6);
          strong = numsOnly[6];
        } else {
          errors.push({ line: idx + 1, errors: ["לא מספיק שדות"] });
          return;
        }
      }

      const row = {
        drawNumber: drawNumber ?? idx + 1,
        date: date || null,
        numbers: nums.map(Number).sort((a, b) => a - b),
        strong,
        winnersLotto,
        winnersDouble,
        source: "csv",
        uploadedAt: new Date().toISOString(),
        researchVersion: null,
      };
      row.format = this.detectFormat(row.numbers, row.strong);
      const v = this.validateDraw(row);
      if (!v.ok) errors.push({ line: idx + 1, errors: v.errors, row });
      else rows.push(row);
    });
    return { rows, errors };
  },

  async fetchOfficialText() {
    const res = await fetch(this.OFFICIAL_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("לא ניתן לטעון file/Lotto.csv");
    const buf = await res.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    if (!/\d{3,},\d{1,2}\/\d{1,2}\/\d{4}/.test(text) && !text.includes("3954")) {
      try {
        text = new TextDecoder("windows-1255").decode(buf);
      } catch (_) {}
    }
    return text;
  },

  buildOfficialDb(parsed) {
    const fmt37 = parsed.rows.filter((d) => d.format === this.FORMAT_37).length;
    const last = [...parsed.rows].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    parsed.rows.forEach((d) => {
      d.source = this.OFFICIAL_ID;
      d.researchVersion = 1;
    });
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      sourceLabel: `מאגר רשמי file/Lotto.csv · ${parsed.rows.length} הגרלות · 6/37: ${fmt37} · אחרונה #${last?.drawNumber || "—"} ${last?.date || ""}`,
      sourceId: this.OFFICIAL_ID,
      draws: parsed.rows,
      isDemo: false,
      isOfficial: true,
      parseErrors: parsed.errors.length,
    };
  },

  async ensureOfficial(force = false) {
    const cur = this.load();
    if (!force && cur.isOfficial && cur.sourceId === this.OFFICIAL_ID && cur.draws.length > 1000) {
      return { changed: false, db: cur };
    }
    if (!force && cur.userUpload && cur.draws.length) {
      return { changed: false, db: cur };
    }
    const text = await this.fetchOfficialText();
    const parsed = this.parseCsv(text);
    if (!parsed.rows.length) throw new Error("מאגר Lotto.csv ריק או לא פוענח");
    const db = this.buildOfficialDb(parsed);
    this.save(db);
    return { changed: true, db, errors: parsed.errors };
  },

  parsePdf(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let raw = "";
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];
      raw += c >= 32 && c < 127 ? String.fromCharCode(c) : c === 10 || c === 13 ? "\n" : " ";
    }
    const lines = [];
    raw.split(/\n+/).forEach((line) => {
      const nums = line.match(/\d+/g);
      if (nums && nums.length >= 7) lines.push(nums.join(","));
    });
    if (!lines.length) {
      return {
        rows: [],
        errors: [{ line: 0, errors: ["PDF: לא נמצאו שורות מספרים לחילוץ. המירו ל-CSV/Excel לייבוא אמין."] }],
      };
    }
    const parsed = this.parseCsv(lines.join("\n"));
    parsed.rows.forEach((r) => {
      r.source = "pdf";
    });
    parsed.errors.unshift({
      line: 0,
      errors: ["PDF: חילוץ חלקי בלבד. בדקו את השורות לפני אישור. עדיף CSV/Excel."],
    });
    return parsed;
  },

  parseExcel(arrayBuffer) {
    if (typeof XLSX === "undefined") {
      return { rows: [], errors: [{ line: 0, errors: ["ספריית Excel לא נטענה"] }] };
    }
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const lines = json.map((r) => (r || []).join(",")).join("\n");
    return this.parseCsv(lines);
  },

  mergeDraws(existing, incoming, { replace = false } = {}) {
    const base = replace ? [] : [...existing];
    const keyOf = (d) => `${d.drawNumber || ""}|${d.date || ""}|${(d.numbers || []).join("-")}|${d.strong}`;
    const seen = new Set(base.map(keyOf));
    const duplicates = [];
    const added = [];
    for (const d of incoming) {
      const k = keyOf(d);
      if (seen.has(k)) {
        duplicates.push(d);
        continue;
      }
      seen.add(k);
      d.researchVersion = (d.researchVersion || null);
      base.push(d);
      added.push(d);
    }
    base.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || (a.drawNumber || 0) - (b.drawNumber || 0));
    return { draws: base, added: added.length, duplicates: duplicates.length };
  },

  filterPeriod(draws, period, customRange) {
    const fmt37 = draws.filter((d) => (d.format || this.detectFormat(d.numbers, d.strong)) === this.FORMAT_37);
    const byDate = [...fmt37].filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
    const lastN = (n) => byDate.slice(-n);
    const sinceYears = (y) => {
      const cut = new Date();
      cut.setFullYear(cut.getFullYear() - y);
      const iso = cut.toISOString().slice(0, 10);
      return byDate.filter((d) => d.date >= iso);
    };
    if (period === "custom" || (typeof period === "string" && period.startsWith("custom:"))) {
      const range = customRange || (() => {
        try {
          return JSON.parse(localStorage.getItem("joklob_custom_period") || "{}");
        } catch {
          return {};
        }
      })();
      const from = range.from || "1900-01-01";
      const to = range.to || "9999-12-31";
      return byDate.filter((d) => d.date >= from && d.date <= to);
    }
    switch (period) {
      case "all":
        return draws;
      case "legacy49":
        return draws.filter((d) => (d.format || this.detectFormat(d.numbers, d.strong)) === this.FORMAT_49);
      case "format37":
        return fmt37;
      case "y5":
        return sinceYears(5);
      case "y2":
        return sinceYears(2);
      case "y1":
        return sinceYears(1);
      case "n250":
        return lastN(250);
      case "n100":
        return lastN(100);
      case "n50":
        return lastN(50);
      case "n25":
        return lastN(25);
      case "n10":
        return lastN(10);
      default:
        return fmt37;
    }
  },

  periodOptions() {
    return [
      { id: "format37", he: "פורמט 6 מתוך 37 (ברירת מחדל)" },
      { id: "all", he: "כל ההיסטוריה (כולל פורמטים מעורבים)" },
      { id: "legacy49", he: "תקופות ישנות עד 49" },
      { id: "y5", he: "5 שנים אחרונות (6/37)" },
      { id: "y2", he: "שנתיים אחרונות" },
      { id: "y1", he: "שנה אחרונה" },
      { id: "n250", he: "250 אחרונות" },
      { id: "n100", he: "100 אחרונות" },
      { id: "n50", he: "50 אחרונות" },
      { id: "n25", he: "25 אחרונות" },
      { id: "n10", he: "10 אחרונות" },
      { id: "custom", he: "טווח מותאם אישית" },
    ];
  },
};
