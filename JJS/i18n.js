window.JOKLOB = window.JOKLOB || {};

JOKLOB.i18n = {
  lang: localStorage.getItem("joklob_lang") || "he",
  dict: {
    he: {
      home: "בית",
      labs: "מעבדות",
      projects: "פרויקטים",
      docs: "מסמכים",
      more: "עוד",
      subtitle: "מעבדת מחקר למתמטיקה ולפיזיקה",
      newResearch: "מחקר חדש",
      openProject: "פרויקט קיים",
      newCalc: "חישוב מתמטי",
      numberLab: "מעבדת מספרים",
      physicsLab: "מעבדת פיזיקה",
      axiomLab: "מעבדת אקסיומות",
      between: "בין מספרים",
      history: "היסטוריה",
      search: "חיפוש",
      makePdf: "יצוא דוח",
      note: "אתר HTML/CSS/JS. חישובים בדפדפן עם math.js — לא ניחושים ולא הימורים.",
    },
    en: {
      home: "Home",
      labs: "Labs",
      projects: "Projects",
      docs: "Docs",
      more: "More",
      subtitle: "Mathematics & physics research lab",
      newResearch: "New research",
      openProject: "Open project",
      newCalc: "Math calculation",
      numberLab: "Number lab",
      physicsLab: "Physics lab",
      axiomLab: "Axiom lab",
      between: "Between numbers",
      history: "History",
      search: "Search",
      makePdf: "Export report",
      note: "HTML/CSS/JS site. Browser math via math.js — no guessing, no gambling.",
    },
  },
  t(key) {
    return (this.dict[this.lang] && this.dict[this.lang][key]) || key;
  },
  setLang(lang) {
    this.lang = lang === "en" ? "en" : "he";
    localStorage.setItem("joklob_lang", this.lang);
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === "he" ? "rtl" : "ltr";
  },
};
