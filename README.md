# JOKLOB — מעבדת מחקר למתמטיקה ולפיזיקה

אפליקציית PWA מלאה (Mobile First, Galaxy S22, RTL עברית + אנגלית).

החישובים מבוצעים ב־**SymPy / NumPy / SciPy / mpmath / Pint** — לא במודל שפה. כל תוצאה מסומנת: מאומת / מספרי / השערה / מודל / חלקי / אין מידע / סתירה.

אין כלי להימורים או ניבוי הגרלות.

## הרצה מקומית (Windows)

דרושים Python 3.11+ ו־Node.js 18+.

### Backend

```powershell
cd "E:\Webs All\TOTO2000\JOKLOB\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

חלון שני:

```powershell
cd "E:\Webs All\TOTO2000\JOKLOB\frontend"
npm install
npm run dev
```

פתחו: http://127.0.0.1:5173

חשבון הדגמה: `demo@joklob.local` / `demo12345`

### התקנה בטלפון Samsung Galaxy S22

1. הריצו את השרתים ברשת המקומית (או פרסו ל־HTTPS).
2. ב־Chrome: פתחו את הכתובת → תפריט → **Add to Home screen** / התקנת אפליקציה.
3. PWA נפתחת במסך מלא (standalone). טיוטות נשמרות גם ב־localStorage במקרה של ניתוק.

לחיבור מהטלפון לאותו מחשב: הפעילו את Vite עם `--host` (כבר מוגדר) וה־API ב־`--host 0.0.0.0`, ואז עדכנו `cors_origins` בקובץ `.env`.

## מסד נתונים

ברירת מחדל: SQLite ב־`backend/data/joklob.db` (עובד מיד).

ל־PostgreSQL:

```
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/joklob
```

## אבטחה

- JWT + סיסמאות hashed
- מסמכים פרטיים לפי משתמש
- קישורי שיתוף עם תפוגה
- מגבלת גודל קובץ וקצב בקשות
- אין הרצת קוד שהמשתמש מעלה

QuTiP אופציונלי: אם מותקן, סימולציית Rabi תשתמש בו; אחרת יש פתרון אנליטי מאומת.
