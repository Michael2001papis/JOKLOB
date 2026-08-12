window.JOKLOB = window.JOKLOB || {};

JOKLOB.ui = {
  escape(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  math(tex, display = true) {
    if (!tex) return "";
    try {
      return `<div class="math">${katex.renderToString(String(tex), { throwOnError: false, displayMode: display })}</div>`;
    } catch {
      return `<div class="math"><code>${this.escape(tex)}</code></div>`;
    }
  },

  tag(code) {
    return JOKLOB.certainty.html(code);
  },

  resultCard(result) {
    if (!result) return "";
    const steps = (result.steps || [])
      .map((s, i) => `<div><b>${i + 1}. ${this.escape(s.title)}</b><div class="muted">${this.escape(s.method || "")}</div>${this.math(s.latex)}</div>`)
      .join("");
    return `
      <div class="card" style="margin-top:12px">
        ${this.tag(result.certainty)}
        ${result.error ? `<p class="err">${this.escape(result.error)}</p>` : ""}
        ${result.warning ? `<p class="err">${this.escape(result.warning)}</p>` : ""}
        <h2>תוצאה</h2>
        ${result.latex ? this.math(result.latex) : ""}
        <pre>${this.escape(typeof result.result === "object" ? JSON.stringify(result.result, null, 2) : result.result)}</pre>
        ${steps ? `<h2>שלבים</h2>${steps}` : ""}
        ${result.verification ? `<h2>אימות</h2><pre>${this.escape(JSON.stringify(result.verification, null, 2))}</pre>` : ""}
        <h2>מגבלות</h2>
        <p>${this.escape(result.limitations || "")}</p>
      </div>`;
  },

  chart(canvasId, xs, ys) {
    requestAnimationFrame(() => {
      const c = document.getElementById(canvasId);
      if (!c || !xs || !xs.length) return;
      const ctx = c.getContext("2d");
      const w = c.width = c.clientWidth * devicePixelRatio;
      const h = c.height = c.clientHeight * devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = 24 * devicePixelRatio;
      const sx = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad);
      const sy = (y) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad);
      ctx.strokeStyle = "rgba(126,231,255,0.25)";
      ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
      ctx.strokeStyle = "#7ee7ff";
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.beginPath();
      xs.forEach((x, i) => {
        const X = sx(x), Y = sy(ys[i]);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    });
  },
};
