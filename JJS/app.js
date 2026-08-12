(() => {
  const app = {
    route: "home",
    titles: {
      home: "בית",
      labs: "מעבדות",
      projects: "פרויקטים",
      research: "מחקר",
      math: "מתמטיקה",
      numbers: "מספרים",
      physics: "פיזיקה",
      axioms: "אקסיומות",
      between: "בין מספרים",
      docs: "מסמכים",
      export: "יצוא",
      history: "היסטוריה",
      more: "עוד",
    },

    init() {
      JOKLOB.i18n.setLang(JOKLOB.i18n.lang);
      document.documentElement.dataset.theme = localStorage.getItem("joklob_theme") || "dark";
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.go(btn.dataset.route));
      });
      window.addEventListener("hashchange", () => this.go((location.hash || "#home").slice(1), false));
      this.go((location.hash || "#home").slice(1), false);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    },

    go(route, push = true) {
      if (!JOKLOB.pages[route]) route = "home";
      this.route = route;
      if (push) location.hash = route;
      document.getElementById("screen-title").textContent = this.titles[route] || "";
      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.toggle("active", ["home", "labs", "projects", "docs", "more"].includes(route) && b.dataset.route === route);
      });
      const content = document.getElementById("content");
      content.innerHTML = JOKLOB.pages[route]();
      this.bind(content);
    },

    bind(root) {
      root.querySelectorAll("[data-go]").forEach((el) => {
        el.addEventListener("click", () => this.go(el.dataset.go));
      });

      if (this.route === "projects") {
        root.querySelector("#proj-add")?.addEventListener("click", () => {
          const title = root.querySelector("#proj-title").value.trim();
          if (!title) return;
          JOKLOB.storage.set((d) => {
            d.projects.unshift({
              id: crypto.randomUUID(),
              title,
              description: root.querySelector("#proj-desc").value.trim(),
              createdAt: new Date().toISOString(),
            });
          });
          JOKLOB.storage.addHistory({ action: "project", detail: title });
          this.go("projects");
        });
      }

      if (this.route === "research") {
        const ta = root.querySelector("#research-text");
        ta?.addEventListener("input", () => {
          JOKLOB.storage.set((d) => { d.drafts.research = ta.value; });
        });
        root.querySelector("#research-run")?.addEventListener("click", () => {
          const text = ta.value;
          const parsed = JOKLOB.mathLab.parseIntent(text);
          const out = root.querySelector("#research-out");
          if (parsed.blocked === "gambling") {
            out.innerHTML = `<div class="card">${JOKLOB.ui.tag("contradiction_impossible")}<p class="err">המעבדה אינה כלי להימורים או ניבוי הגרלות.</p></div>`;
            return;
          }
          if (parsed.blocked === "physics") {
            out.innerHTML = `<div class="card">${JOKLOB.ui.tag("contradiction_impossible")}
              <p>לפי הפיזיקה הידועה לא ניתן «לבטל כבידה». ניתן רק להריץ מודל תיאורטי עם g=0 במעבדת הפיזיקה.</p>
              <button class="btn" data-go="physics">למעבדת פיזיקה</button></div>`;
            out.querySelector("[data-go]")?.addEventListener("click", (e) => this.go(e.currentTarget.dataset.go));
            return;
          }
          const assumptions = [
            "הפרסור הוא מבוסס-כללים בדפדפן, לא המצאת חוקים.",
            "החישוב מבוצע ב-math.js.",
            "אם הביטוי דו-משמעי — התוצאה מסומנת חלקית / אין מידע.",
          ];
          let html = `<div class="card">${JOKLOB.ui.tag(parsed.expression ? "partial" : "insufficient_info")}
            <h2>ניסוח</h2><p>${JOKLOB.ui.escape(parsed.expression || "לא חולץ ביטוי — נדרש ניסוח מפורש.")}</p>
            <h2>הנחות</h2><ul>${assumptions.map((a) => `<li>${a}</li>`).join("")}</ul></div>`;
          if (parsed.expression) {
            const result = JOKLOB.mathLab.run(parsed.expression, parsed.intent === "evaluate" && parsed.expression.includes("=") ? "solve" : parsed.intent);
            html += JOKLOB.ui.resultCard(result);
            JOKLOB.storage.addHistory({ action: "research", detail: parsed.expression });
          }
          out.innerHTML = html;
        });
      }

      if (this.route === "math") {
        root.querySelector("#math-run")?.addEventListener("click", () => {
          const intent = root.querySelector("#math-intent").value;
          const expr = root.querySelector("#math-expr").value;
          const result = JOKLOB.mathLab.run(expr, intent);
          root.querySelector("#math-out").innerHTML = JOKLOB.ui.resultCard(result);
          JOKLOB.storage.addHistory({ action: "math", detail: expr });
        });
      }

      if (this.route === "numbers") {
        root.querySelector("#num-run")?.addEventListener("click", () => {
          const raw = root.querySelector("#num-raw").value;
          const xs = raw.split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
          const analysis = JOKLOB.numbersLab.analyze(xs);
          const combined = JOKLOB.numbersLab.combine(xs, root.querySelector("#num-method").value);
          const exploded = JOKLOB.numbersLab.explode(xs[0] ?? 0, 6);
          root.querySelector("#num-out").innerHTML = `
            <div class="card" style="margin-top:12px">
              ${JOKLOB.ui.tag(analysis.certainty)}
              <h2>סטטיסטיקה</h2><pre>${JOKLOB.ui.escape(JSON.stringify(analysis.statistics, null, 2))}</pre>
              <h2>הסברים אפשריים</h2><pre>${JOKLOB.ui.escape(JSON.stringify(analysis.explanations, null, 2))}</pre>
              <p>${JOKLOB.ui.escape(analysis.nextTermPolicy?.reason)}</p>
              <h2>Combine</h2><pre>${JOKLOB.ui.escape(JSON.stringify(combined, null, 2))}</pre>
              <h2>הופכי לדוגמה</h2><pre>${JOKLOB.ui.escape(JSON.stringify(exploded, null, 2))}</pre>
            </div>`;
          JOKLOB.storage.addHistory({ action: "numbers", detail: raw });
        });
      }

      if (this.route === "physics") {
        root.querySelector("#phys-run")?.addEventListener("click", () => {
          let params = {};
          try { params = JSON.parse(root.querySelector("#phys-params").value || "{}"); }
          catch { alert("JSON לא תקין"); return; }
          const id = root.querySelector("#phys-id").value;
          if (root.querySelector("#phys-cancel").checked) {
            params.cancel_gravity = true;
            if (id === "projectile") params.g = 0;
          }
          const result = JOKLOB.physicsLab.run(id, params);
          let html = `<div class="card">${JOKLOB.ui.tag(result.certainty)}
            ${result.warning ? `<p class="err">${JOKLOB.ui.escape(result.warning)}</p>` : ""}
            ${result.error ? `<p class="err">${JOKLOB.ui.escape(result.error)}</p>` : ""}
            <h2>הנחות</h2><ul>${(result.assumptions || []).map((a) => `<li>${JOKLOB.ui.escape(a)}</li>`).join("")}</ul>
            ${(result.equations || []).map((e) => JOKLOB.ui.math(e)).join("")}
            ${result.force_N != null ? `<p>F = ${result.force_N} N</p>` : ""}
            ${result.gamma != null ? `<p>γ = ${result.gamma}</p>` : ""}
            <p>${JOKLOB.ui.escape(result.limitations || "")}</p>
          </div>`;
          root.querySelector("#phys-out").innerHTML = html;
          const s = result.series;
          if (s?.t && s?.x) JOKLOB.ui.chart("phys-chart", s.t, s.y || s.x);
          else if (s?.x && s?.psi) JOKLOB.ui.chart("phys-chart", s.x, s.psi);
          else if (s?.v && s?.gamma) JOKLOB.ui.chart("phys-chart", s.v, s.gamma);
          JOKLOB.storage.addHistory({ action: "physics", detail: id });
        });
      }

      if (this.route === "axioms") {
        root.querySelector("#ax-run")?.addEventListener("click", () => {
          const definition = {
            objects: root.querySelector("#ax-obj").value.split(/[,\s]+/).filter(Boolean),
            operations: [root.querySelector("#ax-op").value],
            axioms: root.querySelector("#ax-text").value.split("\n").filter(Boolean),
          };
          const analysis = JOKLOB.axiomsLab.analyze(definition);
          root.querySelector("#ax-out").innerHTML = `
            <div class="card" style="margin-top:12px">
              ${JOKLOB.ui.tag(analysis.certainty)}
              <pre>${JOKLOB.ui.escape(JSON.stringify(analysis, null, 2))}</pre>
            </div>`;
        });
      }

      if (this.route === "between") {
        const run = () => {
          const zoom = Number(root.querySelector("#bt-zoom").value);
          const data = JOKLOB.betweenLab.explore(
            root.querySelector("#bt-a").value,
            root.querySelector("#bt-b").value,
            zoom
          );
          const svg = root.querySelector("#bt-svg");
          if (data.ok) {
            const lo = data.view.left, hi = data.view.right;
            const marks = (data.rationals || []).slice(0, 40).map((r) => {
              const x = 10 + ((r.value - lo) / (hi - lo || 1)) * 300;
              return `<line x1="${x}" y1="34" x2="${x}" y2="50" stroke="#b388ff"/><text x="${x}" y="72" font-size="7" fill="#9bb0d0" text-anchor="middle">${r.frac}</text>`;
            }).join("");
            svg.innerHTML = `<line x1="10" y1="42" x2="310" y2="42" stroke="#7ee7ff"/>${marks}`;
            root.querySelector("#bt-out").innerHTML = `
              <div class="card">${JOKLOB.ui.tag(data.certainty)}
                ${(data.theorems || []).map((th) => `<p><b>${JOKLOB.ui.escape(th.title)}.</b> ${JOKLOB.ui.escape(th.statement)}</p>`).join("")}
                <h2>אי-רציונליים מוכרים במרווח</h2>
                <pre>${JOKLOB.ui.escape(JSON.stringify(data.namedIrrationals, null, 2))}</pre>
                <p>${JOKLOB.ui.escape(data.limitations)}</p>
              </div>`;
          } else {
            root.querySelector("#bt-out").innerHTML = `<p class="err">${JOKLOB.ui.escape(data.error)}</p>`;
          }
        };
        root.querySelector("#bt-run")?.addEventListener("click", run);
        root.querySelector("#bt-zoom")?.addEventListener("input", run);
      }

      if (this.route === "docs") {
        root.querySelector("#doc-add")?.addEventListener("click", () => {
          const title = root.querySelector("#doc-title").value.trim() || "מסמך";
          const notes = root.querySelector("#doc-notes").value;
          JOKLOB.storage.set((d) => {
            d.docs.unshift({ id: crypto.randomUUID(), title, notes, at: new Date().toISOString() });
          });
          this.go("docs");
        });
      }

      if (this.route === "export") {
        root.querySelector("#ex-print")?.addEventListener("click", () => {
          const title = root.querySelector("#ex-title").value;
          const q = root.querySelector("#ex-q").value;
          const r = root.querySelector("#ex-r").value;
          const w = window.open("", "_blank");
          w.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
            <style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.5} h1{color:#1a3a6b}</style></head><body>
            <h1>${JOKLOB.ui.escape(title)}</h1>
            <p><b>תאריך:</b> ${new Date().toLocaleString("he-IL")}</p>
            <h2>1. שאלת המחקר</h2><p>${JOKLOB.ui.escape(q)}</p>
            <h2>2. תוצאות</h2><p>${JOKLOB.ui.escape(r)}</p>
            <h2>3. ודאות</h2><p>הדוח משקף קלט משתמש. אין מקורות מומצאים.</p>
            <p style="color:#666">JOKLOB — דוח מקומי. השתמשו בהדפסה → Save as PDF.</p>
            </body></html>`);
          w.document.close();
          w.focus();
          w.print();
        });
      }

      if (this.route === "more") {
        root.querySelector("#lang-he")?.addEventListener("click", () => { JOKLOB.i18n.setLang("he"); this.go("more"); });
        root.querySelector("#lang-en")?.addEventListener("click", () => { JOKLOB.i18n.setLang("en"); this.go("more"); });
        root.querySelector("#theme-dark")?.addEventListener("click", () => {
          document.documentElement.dataset.theme = "dark";
          localStorage.setItem("joklob_theme", "dark");
        });
        root.querySelector("#theme-light")?.addEventListener("click", () => {
          document.documentElement.dataset.theme = "light";
          localStorage.setItem("joklob_theme", "light");
        });
        root.querySelector("#wipe-data")?.addEventListener("click", () => {
          if (confirm("למחוק את כל הנתונים המקומיים?")) {
            localStorage.removeItem("joklob_data_v1");
            this.go("more");
          }
        });
      }
    },
  };

  document.addEventListener("DOMContentLoaded", () => app.init());
})();
