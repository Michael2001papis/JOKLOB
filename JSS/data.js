window.JOKLOB = window.JOKLOB || {};

JOKLOB.data = {
  KEY: "joklob_research_db_v1",
  FORMAT_37: "6/37+strong7",
  FORMAT_49: "legacy_to_49",

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
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const demo = this.makeDemoFormat37(400);
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      sourceLabel: "מאגר הדגמה סינתטי 6/37 (לא נתוני הגרלה רשמיים)",
      draws: demo,
      isDemo: true,
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

  detectFormat(numbers) {
    const max = Math.max(...numbers);
    if (max <= 37) return this.FORMAT_37;
    if (max <= 49) return this.FORMAT_49;
    return "unknown";
  },

  validateDraw(row) {
    const errors = [];
    const nums = (row.numbers || []).map(Number);
    if (nums.length !== 6) errors.push("חייבים בדיוק 6 מספרים ראשיים");
    if (new Set(nums).size !== nums.length) errors.push("מספר כפול באותה הגרלה");
    const fmt = row.format || this.detectFormat(nums);
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
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      if (/[a-zA-Zא-ת]/.test(t) && !/\d/.test(t)) return;
      const parts = t.split(/[\s,;|\t]+/).map((x) => x.trim()).filter(Boolean);
      // formats: draw,date,n1..n6,strong  OR  n1..n6,strong  OR date,n1..n6,strong
      let drawNumber = null, date = null, nums = [], strong = null;
      const numsOnly = parts.map(Number).filter((x) => Number.isFinite(x));
      if (parts[0] && parts[0].includes("-")) {
        date = parts[0];
        nums = parts.slice(1, 7).map(Number);
        strong = Number(parts[7]);
      } else if (numsOnly.length >= 8) {
        drawNumber = numsOnly[0];
        // if second looks like date-less, treat as draw,n1..n6,strong
        nums = numsOnly.slice(1, 7);
        strong = numsOnly[7];
        if (parts[1] && String(parts[1]).includes("-")) {
          date = parts[1];
          nums = parts.slice(2, 8).map(Number);
          strong = Number(parts[8]);
        }
      } else if (numsOnly.length >= 7) {
        nums = numsOnly.slice(0, 6);
        strong = numsOnly[6];
      } else {
        errors.push({ line: idx + 1, errors: ["לא מספיק שדות"] });
        return;
      }
      const row = {
        drawNumber: drawNumber ?? idx + 1,
        date: date || null,
        numbers: nums.map(Number).sort((a, b) => a - b),
        strong,
        source: "csv",
        uploadedAt: new Date().toISOString(),
      };
      row.format = this.detectFormat(row.numbers);
      const v = this.validateDraw(row);
      if (!v.ok) errors.push({ line: idx + 1, errors: v.errors, row });
      else rows.push(row);
    });
    return { rows, errors };
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
      base.push(d);
      added.push(d);
    }
    base.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || (a.drawNumber || 0) - (b.drawNumber || 0));
    return { draws: base, added: added.length, duplicates: duplicates.length };
  },

  filterPeriod(draws, period) {
    const fmt37 = draws.filter((d) => (d.format || this.detectFormat(d.numbers)) === this.FORMAT_37);
    const byDate = [...fmt37].filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
    const lastN = (n) => byDate.slice(-n);
    const sinceYears = (y) => {
      const cut = new Date();
      cut.setFullYear(cut.getFullYear() - y);
      const iso = cut.toISOString().slice(0, 10);
      return byDate.filter((d) => d.date >= iso);
    };
    switch (period) {
      case "all":
        return draws;
      case "legacy49":
        return draws.filter((d) => (d.format || this.detectFormat(d.numbers)) === this.FORMAT_49);
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
    ];
  },
};
