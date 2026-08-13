/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 */
window.JOKLOB = window.JOKLOB || {};

JOKLOB.icons = {
  svg(d) {
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  },
};
JOKLOB.icons.gen = JOKLOB.icons.svg('<circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><circle cx="8" cy="16" r="2.2"/><circle cx="16" cy="16" r="2.2"/><circle cx="12" cy="12" r="2.2"/>');
JOKLOB.icons.research = JOKLOB.icons.svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>');
JOKLOB.icons.db = JOKLOB.icons.svg('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>');
JOKLOB.icons.check = JOKLOB.icons.svg('<path d="M9 11l3 3 8-8"/><path d="M21 12a9 9 0 11-6.2-8.6"/>');
JOKLOB.icons.more = JOKLOB.icons.svg('<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>');
JOKLOB.icons.help = JOKLOB.icons.svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 114 2c0 1.5-2 1.8-2 3.2"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>');
JOKLOB.icons.sun = JOKLOB.icons.svg('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>');
JOKLOB.icons.moon = JOKLOB.icons.svg('<path d="M17 14.5A7 7 0 118.5 6 5.5 5.5 0 0017 14.5z"/>');
JOKLOB.icons.back = JOKLOB.icons.svg('<path d="M14 6l-6 6 6 6"/>');
JOKLOB.icons.chev = JOKLOB.icons.svg('<path d="M9 6l6 6-6 6"/>');
JOKLOB.icons.snap = JOKLOB.icons.svg('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5V4h8v1M8 10h8"/>');
JOKLOB.icons.period = JOKLOB.icons.svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>');
JOKLOB.icons.hist = JOKLOB.icons.svg('<path d="M4 13a8 8 0 101.2-4.3"/><path d="M4 5v4h4M12 8v5l3 2"/>');
JOKLOB.icons.freq = JOKLOB.icons.svg('<path d="M5 19V9M10 19V5M15 19v-7M20 19v-4"/>');
JOKLOB.icons.fire = JOKLOB.icons.svg('<path d="M12 3s5 5 5 9a5 5 0 11-10 0c0-2 2-5 5-9z"/>');
JOKLOB.icons.press = JOKLOB.icons.svg('<path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 18h14"/>');
JOKLOB.icons.strong = JOKLOB.icons.svg('<path d="M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.8z"/>');
JOKLOB.icons.pairs = JOKLOB.icons.svg('<circle cx="8" cy="12" r="3.2"/><circle cx="16" cy="12" r="3.2"/>');
JOKLOB.icons.seq = JOKLOB.icons.svg('<path d="M4 16l5-8 4 5 7-9"/>');
JOKLOB.icons.parity = JOKLOB.icons.svg('<circle cx="8" cy="12" r="3"/><rect x="13" y="9" width="7" height="6" rx="1"/>');
JOKLOB.icons.ranges = JOKLOB.icons.svg('<path d="M4 18V8h4v10M10 18V5h4v13M16 18v-6h4v6"/>');
JOKLOB.icons.shadow = JOKLOB.icons.svg('<circle cx="10" cy="12" r="5"/><path d="M14.2 8.2a5 5 0 010 7.6"/>');
JOKLOB.icons.world = JOKLOB.icons.svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>');
JOKLOB.icons.pdf = JOKLOB.icons.svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M9 14h6M9 17h4"/>');
JOKLOB.icons.upload = JOKLOB.icons.svg('<path d="M12 16V6M8 9l4-4 4 4"/><path d="M5 18h14"/>');
JOKLOB.icons.hot = JOKLOB.icons.svg('<path d="M12 21a6 6 0 006-6c0-4-6-10-6-10S6 11 6 15a6 6 0 006 6z"/>');
JOKLOB.icons.cold = JOKLOB.icons.svg('<path d="M12 3v18M12 8l-3-2M12 8l3-2M12 16l-3 2M12 16l3 2M6 10l3 2-3 2M18 10l-3 2 3 2"/>');
JOKLOB.icons.quiet = JOKLOB.icons.svg('<path d="M5 10v4h3l4 3V7L8 10H5zM16 9a4 4 0 010 6"/>');
JOKLOB.icons.board = JOKLOB.icons.svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/>');
JOKLOB.icons.compare = JOKLOB.icons.svg('<path d="M7 19V8M12 19V5M17 19v-7"/>');

JOKLOB.nav = {
  titles: {
    home: "מחולל",
    about: "אודות",
    research: "מחקר",
    upload: "מאגר",
    backtest: "בדיקה",
    more: "עוד",
    "r-overview": "לוח ראשי",
    "r-period": "בחירת תקופה",
    "r-freq": "שכיחויות",
    "r-hot": "חמים",
    "r-cold": "קרים",
    "r-quiet": "שקטים",
    "r-fire": "מדד אש",
    "r-pressure": "מדד לחץ",
    "r-pairs": "זוגות ושלשות",
    "r-seq": "רצפים",
    "r-parity": "זוגי / אי־זוגי",
    "r-ranges": "פיזור טווחים",
    "r-shadow": "צל הגרלה",
    "r-strong": "המספר החזק",
    "r-world": "שכבה עולמית",
    "r-snapshot": "צילום מיכאל",
    "r-history": "היסטוריית חישובים",
    "r-compare": "השוואת מודלים",
    "r-pdf": "ייצוא PDF",
  },
  main: [
    { id: "home", he: "מחולל", icon: "gen" },
    { id: "research", he: "מחקר", icon: "research" },
    { id: "upload", he: "מאגר", icon: "db" },
    { id: "backtest", he: "בדיקה", icon: "check" },
    { id: "more", he: "עוד", icon: "more" },
  ],
  groups: [
    {
      id: "status",
      he: "תמונת מצב",
      items: [
        { id: "r-overview", he: "לוח מחקר ראשי", hint: "סיכום מדגם, סכום ודירוגים חיים", icon: "board" },
        { id: "r-period", he: "בחירת תקופה", hint: "פורמט 6/37 או טווח מותאם", icon: "period" },
        { id: "r-snapshot", he: "צילום המחקר של מיכאל", hint: "ייחוס היסטורי 08.08.2026", icon: "snap" },
        { id: "r-history", he: "היסטוריית חישובים", hint: "Seed וצירופים שנוצרו", icon: "hist" },
      ],
    },
    {
      id: "numbers",
      he: "ניתוח מספרים",
      items: [
        { id: "r-freq", he: "שכיחויות", hint: "הופעות, דירוג ומגמה לכל מספר", icon: "freq" },
        { id: "r-hot", he: "חמים", hint: "מספרים בולטים במדגם", icon: "hot" },
        { id: "r-cold", he: "קרים", hint: "מספרים חלשים היסטורית", icon: "cold" },
        { id: "r-quiet", he: "שקטים", hint: "זמן רב בלי הופעה", icon: "quiet" },
        { id: "r-fire", he: "מדד אש", hint: "חזק לאחרונה + מגמה", icon: "fire" },
        { id: "r-pressure", he: "מדד לחץ", hint: "היה סביר — שקט לאחרונה", icon: "press" },
        { id: "r-strong", he: "המספר החזק", hint: "ניתוח נפרד ל־1–7", icon: "strong" },
      ],
    },
    {
      id: "structure",
      he: "מבנה הצירוף",
      items: [
        { id: "r-pairs", he: "זוגות ושלשות", hint: "הופעות משותפות מול הצפוי", icon: "pairs" },
        { id: "r-seq", he: "רצפים", hint: "רצפים קצרים בשישיות", icon: "seq" },
        { id: "r-parity", he: "זוגי ואי־זוגי", hint: "התפלגות מבנה 3:3 וכו׳", icon: "parity" },
        { id: "r-ranges", he: "פיזור טווחים", hint: "1–10 עד 31–37", icon: "ranges" },
        { id: "r-shadow", he: "צל הגרלה", hint: "סכום, אחוזונים וחתימה", icon: "shadow" },
      ],
    },
    {
      id: "test",
      he: "בדיקה והשוואה",
      items: [
        { id: "backtest", he: "בדיקת עבר", hint: "Walk-forward מול אקראי", icon: "check" },
        { id: "r-compare", he: "השוואת מודלים", hint: "אותו Seed לכל השיטות", icon: "compare" },
        { id: "r-world", he: "שכבה עולמית ניסיונית", hint: "השערה בלבד, לא הוכחה", icon: "world" },
      ],
    },
    {
      id: "data",
      he: "נתונים ודוחות",
      items: [
        { id: "upload", he: "העלאת מאגר", hint: "מצב, ייבוא וסדר ועדכון", icon: "upload" },
        { id: "r-pdf", he: "ייצוא PDF", hint: "דוח האצווה האחרונה", icon: "pdf" },
      ],
    },
  ],
  parentOf(route) {
    if (route === "about") return "more";
    if (["home", "research", "upload", "backtest", "more"].includes(route)) return route;
    if (route === "r-pdf" || route === "upload") return route === "upload" ? "upload" : "research";
    if (route === "backtest") return "backtest";
    if (String(route).startsWith("r-")) return "research";
    return "home";
  },
};
