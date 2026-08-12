window.JOKLOB = window.JOKLOB || {};

JOKLOB.pdf = {
  exportBatch(batch) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("יש לאפשר חלונות קופצים לייצוא PDF");
      return;
    }
    const tickets = (batch && batch.tickets) || [];
    const mc = JOKLOB.generator.monteCarloSums(1500, (batch && batch.seed) || "mc");
    const rows = tickets.map((t) => `
      <div class="t">
        <h3>צירוף #${t.group}${batch.mode === "double" ? ` · לוח ${t.board}` : ""}</h3>
        <p dir="ltr" style="font-size:22px;font-weight:800">${t.numbers.map((n) => String(n).padStart(2, "0")).join(" · ")}
          &nbsp;|&nbsp; חזק: ${t.strong}</p>
        <p>שיטה: ${esc(t.methodLabel)} · מזהה: ${esc(t.calcId)} · Seed: ${esc(t.seed)}</p>
        <p>ציון איזון: ${t.balanceScore.toFixed(3)} · ציון משוקלל: ${t.score.toFixed(3)}</p>
        <p>סכום: ${t.sum} · דגלים אנושיים: ${t.humanFlags.length ? esc(t.humanFlags.join("; ")) : "אין"}</p>
        <p>מקור נתונים: ${esc(t.dataChecked.sourceNote)} (${t.dataChecked.draws} הגרלות)</p>
      </div>`).join("");

    w.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8">
      <title>JOKLOB דוח</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;line-height:1.5;color:#10203a}
        h1{color:#1a4a8a} .box{border:1px solid #ccd;padding:12px;border-radius:10px;margin:12px 0;background:#f7f9ff}
        .warn{border:1px dashed #c90;background:#fff8e6;padding:12px;border-radius:10px}
        .t{border-bottom:1px solid #dde;padding:10px 0}
      </style></head><body>
      <h1>JOKLOB</h1>
      <p>תאריך יצירה: ${esc(new Date(batch.createdAt || Date.now()).toLocaleString("he-IL"))}</p>
      <div class="warn"><b>גילוי נאות:</b> אין אפשרות להבטיח או לנבא זכייה בהגרלה אקראית.
      בהגרלה הוגנת לכל צירוף חוקי אותה הסתברות. ניתוח היסטוריה / מודל ניסיוני אינם משפרים סיכויי זכייה.</div>
      <div class="box">
        <b>שיטה:</b> ${esc(JOKLOB.generator.METHODS[batch.method]?.he || batch.method)}<br>
        <b>מצב:</b> ${batch.mode === "double" ? "דאבל לוטו" : "לוטו רגיל"} ·
        <b>Seed:</b> <span dir="ltr">${esc(batch.seed)}</span>
      </div>
      <h2>הצירופים</h2>
      ${rows}
      <h2>הסבר מתמטי</h2>
      <p>הבחירה משלבת אקראיות (PRNG מבוסס Seed / אקראיות קריפטוגרפית ליצירת Seed)
      עם מדדי איזון ותדירות על מאגר הגרלות. המדדים משמשים לדירוג מועמדים — לא כתחזית.</p>
      <h2>Monte Carlo (שקיפות)</h2>
      <p>${esc(mc.note)} דגימות=${mc.n}, ממוצע סכום≈${mc.mean.toFixed(2)}, טווח ${mc.min}–${mc.max}.</p>
      <p style="color:#666">הדפסה → Save as PDF</p>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>`);
    w.document.close();

    function esc(s) {
      return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  },
};
