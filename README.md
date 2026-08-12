# JOKLOB — HTML / CSS / JS

אתר סטטי אחד: `index.html` + תיקיות `css/` ו-`js/`.

## מבנה

```
index.html          ← קובץ HTML יחיד
css/main.css
js/                 ← מודולים (מתמטיקה, מספרים, פיזיקה...)
assets/icon.svg
manifest.webmanifest
sw.js
vercel.json
```

אין React בפריסה. החישובים רצים בדפדפן עם **math.js** (CDN). נתונים נשמרים ב-`localStorage`.

## הרצה מקומית

פתחו את `index.html` בשרת סטטי (לא כ-file:// בגלל Service Worker):

```powershell
npx --yes serve .
```

או ב-VS Code: Live Server על השורש.

## Vercel

Root Directory: `./`  
אין Build Command — אתר סטטי.  
`vercel.json` כבר מוגדר.

התיקיות `frontend/` (React ישן) ו-`backend/` (FastAPI) נשארות בריפו לפיתוח מתקדם, אבל **לא** נפרסות ל-Vercel.

חשוב: אין ניבוי הגרלות. תוצאות מסומנות (מאומת / מספרי / השערה / מודל / חלקי / אין מידע / סתירה).
