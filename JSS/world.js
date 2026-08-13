/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

window.JOKLOB = window.JOKLOB || {};

/** שכבת הקשר עולמית — ניסיונית בלבד, לא חלק מוכח מהמודל הסטטיסטי. */
JOKLOB.world = {
  DAYS: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],

  snapshot() {
    const d = new Date();
    const extra = this.loadExtra();
    return {
      kind: "ניסוי / השערה",
      weekday: d.getDay(),
      weekdayHe: this.DAYS[d.getDay()],
      dayOfMonth: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      hour: d.getHours(),
      updatedAt: d.toISOString(),
      source: "שעון המכשיר המקומי",
      markets: {
        value: extra.volatility === "" ? null : extra.volatility,
        source: extra.volatility === "" ? "אין פיד שוק מחובר" : "הזנת משתמש ידנית",
        updatedAt: extra.updatedAt || null,
      },
      news: {
        value: extra.events === "" ? null : extra.events,
        source: extra.events === "" ? "אין פיד חדשות מחובר" : "הזנת משתמש ידנית",
        updatedAt: extra.updatedAt || null,
      },
      humanBiasNote: "דפוסי בחירה אנושיים נפוצים (ימי הולדת, מספרים נמוכים) אינם משפיעים על הכדורים.",
      disclaimer:
        "אין ראיה שמצב שוק, מלחמות או חדשות משפיעים על הכדורים בהגרלה. השכבה ניסיונית בלבד.",
    };
  },

  loadExtra() {
    try {
      return JSON.parse(localStorage.getItem("joklob_world_extra") || "{}");
    } catch {
      return {};
    }
  },

  saveExtra(extra) {
    localStorage.setItem(
      "joklob_world_extra",
      JSON.stringify({ ...extra, updatedAt: new Date().toISOString() })
    );
  },

  toCtx(mode) {
    const s = this.snapshot();
    return {
      day: s.weekday,
      dayOfMonth: s.dayOfMonth,
      month: s.month,
      year: s.year,
      hour: s.hour,
      volatility: Number(s.markets.value) || 0,
      events: Number(s.news.value) || 0,
      mode,
      source: s.source,
      updatedAt: s.updatedAt,
      disclaimer: s.disclaimer,
    };
  },
};
