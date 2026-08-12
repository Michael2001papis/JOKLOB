window.JOKLOB = window.JOKLOB || {};

JOKLOB.pdf = {
  esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },
  exportBatch(batch) {
    const w = window.open("", "_blank");
    if (!w) return alert("אפשרו חלונות קופצים");
    const rows = (batch.tickets || [])
      .map(
        (t) => `<div class="t">
        <h3>#${t.group}${batch.mode === "double" ? " לוח " + t.board : ""}</h3>
        <p dir="ltr" style="font-size:20px;font-weight:800">${t.numbers.join(" · ")} | חזק ${t.strong}</p>
        <p>מודל: ${this.esc(t.methodLabel)} · ציון התאמה: ${Number(t.researchScore || 0).toFixed(3)}</p>
        <p>אש: ${t.firePicked?.join(", ") || "-"} · לחץ: ${t.pressurePicked?.join(", ") || "-"}</p>
        <p>חם: ${t.hotPicked?.join(", ") || "-"} · קר: ${t.coldPicked?.join(", ") || "-"}</p>
        <p>סכום ${t.signature?.sum} · זוגי/אי־זוגי ${t.signature?.evenOdd?.join("/") } · טווחים ${t.signature?.bandPattern}</p>
        <p>Seed: ${this.esc(t.seed)} · מזהה: ${this.esc(t.calcId)}</p>
        <p>גרסת מאגר: ${this.esc(t.dataVersion?.source)} (${t.dataVersion?.drawsUsed} הגרלות)</p>
      </div>`
      )
      .join("");
    w.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>JOKLOB דוח מחקר</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.5}.warn{border:1px dashed #c90;background:#fff8e0;padding:12px;border-radius:8px;margin:12px 0}.t{border-bottom:1px solid #ddd;padding:10px 0}</style></head><body>
      <h1>JOKLOB Research Engine — מנוע המחקר של מיכאל</h1>
      <p>${this.esc(new Date(batch.createdAt || Date.now()).toLocaleString("he-IL"))}</p>
      <div class="warn"><b>גילוי נאות:</b> הנתונים עוזרים להבין את העבר — הם אינם מבטיחים את העתיד.
      אין מספר בטוח, אין זכייה מובטחת, ואין סיכוי משופר ללא הוכחה.</div>
      <p>שיטה: ${this.esc(JOKLOB.generator.METHODS[batch.method]?.he || batch.method)} · Seed: <span dir="ltr">${this.esc(batch.seed)}</span></p>
      <p>צילום ייחוס: ${this.esc(JOKLOB.snapshot.name)}</p>
      ${rows}
      <script>onload=()=>print()<\/script></body></html>`);
    w.document.close();
  },
};
