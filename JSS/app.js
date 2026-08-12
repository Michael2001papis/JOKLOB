/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

(() => {
  const state = { route: "home", mode: "regular", lastBatch: null };

  function go(route, push = true) {
    if (!JOKLOB.pages[route]) route = "home";
    state.route = route;
    if (push) location.hash = route;
    document.getElementById("screen-title").textContent = route;
    document.querySelectorAll(".nav-btn").forEach((b) => {
      const main = ["home", "research", "upload", "backtest", "more"];
      b.classList.toggle("active", main.includes(route) && b.dataset.route === route);
    });
    const root = document.getElementById("content");
    root.innerHTML = JOKLOB.pages[route]();
    bind(root);
  }

  function findTicket(id) {
    return (state.lastBatch?.tickets || []).find((t) => t.calcId === id) ||
      JOKLOB.storage.get().tickets.find((t) => t.calcId === id);
  }

  function renderResults(batch) {
    state.lastBatch = batch;
    JOKLOB.storage.setLast(batch);
    const box = document.getElementById("results");
    if (!box) return;
    box.innerHTML = batch.tickets.map((t) => JOKLOB.ui.ticketCard(t)).join("");
    const ba = document.getElementById("batch-actions");
    if (ba) ba.style.display = "grid";
    bindTicketActions(box);
  }

  function bindTicketActions(root) {
    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = findTicket(btn.dataset.id);
        if (!t) return;
        if (btn.dataset.act === "save") {
          JOKLOB.storage.saveTicket(t);
          btn.textContent = "נשמר ✓";
        } else if (btn.dataset.act === "variant") {
          runGenerate({ seed: null });
        } else if (btn.dataset.act === "replay") {
          runGenerate({ seed: t.seed });
        } else if (btn.dataset.act === "pdf-one") {
          JOKLOB.pdf.exportBatch({ ...state.lastBatch, tickets: [t] });
        }
      });
    });
  }

  function runGenerate(override = {}) {
    const method = document.getElementById("method")?.value || "michael_hybrid";
    const period = document.getElementById("period")?.value || "format37";
    const count = Number(document.getElementById("count")?.value || 1);
    const exp = document.getElementById("exp-mode")?.value || "seed_only";
    const seedInput = document.getElementById("seed")?.value.trim();
    const d = JOKLOB.storage.get();
    d.period = period;
    d.experimentalMode = exp;
    JOKLOB.storage.save(d);
    const batch = JOKLOB.generator.generate({
      method,
      period,
      count,
      mode: state.mode,
      seed: override.seed !== undefined ? override.seed : seedInput || null,
      experimentalMode: exp === "off" ? "seed_only" : exp,
      experimentalWeight: 0.08,
    });
    renderResults(batch);
  }

  function bind(root) {
    root.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));

    if (state.route === "home") {
      root.querySelectorAll("#mode-seg button").forEach((b) => {
        b.addEventListener("click", () => {
          root.querySelectorAll("#mode-seg button").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          state.mode = b.dataset.mode;
        });
      });
      // fix period selected
      const period = JOKLOB.storage.get().period || "format37";
      const sel = root.querySelector("#period");
      if (sel) sel.value = period;
      root.querySelector("#generate")?.addEventListener("click", () => runGenerate({}));
      root.querySelector("#pdf-btn")?.addEventListener("click", () => state.lastBatch && JOKLOB.pdf.exportBatch(state.lastBatch));
      root.querySelector("#alt-btn")?.addEventListener("click", () => runGenerate({ seed: null }));
      if (JOKLOB.storage.get().last?.tickets?.length) renderResults(JOKLOB.storage.get().last);
    }

    if (state.route === "r-fire") {
      root.querySelector("#save-fire-w")?.addEventListener("click", () => {
        JOKLOB.analyze.saveFireWeights({
          recent: Number(root.querySelector("#fw-recent").value),
          historic: Number(root.querySelector("#fw-historic").value),
          trend: Number(root.querySelector("#fw-trend").value),
          stability: Number(root.querySelector("#fw-stability").value),
        });
        go("r-fire");
      });
    }

    if (state.route === "upload") {
      const doImport = async (replace) => {
        let incoming = [];
        const allErrors = [];
        const csv = root.querySelector("#csv").value.trim();
        if (csv) {
          const parsed = JOKLOB.data.parseCsv(csv);
          incoming = incoming.concat(parsed.rows);
          allErrors.push(...parsed.errors);
        }
        const manual = root.querySelector("#manual").value.trim();
        if (manual) {
          const parsed = JOKLOB.data.parseCsv(manual);
          incoming = incoming.concat(parsed.rows);
          allErrors.push(...parsed.errors);
        }
        const xfile = root.querySelector("#xlsx").files?.[0];
        if (xfile) {
          const buf = await xfile.arrayBuffer();
          const parsed = JOKLOB.data.parseExcel(buf);
          incoming = incoming.concat(parsed.rows);
          allErrors.push(...parsed.errors);
        }
        const pfile = root.querySelector("#pdf").files?.[0];
        if (pfile) {
          allErrors.push({ line: 0, errors: ["PDF לא מחולץ אוטומטית. המירו ל-CSV/Excel."] });
        }
        const box = root.querySelector("#import-errors");
        if (allErrors.length) {
          box.innerHTML = `<div class="disclaimer"><b>שגיאות לפני הכנסה:</b><pre>${JOKLOB.ui.esc(JSON.stringify(allErrors.slice(0, 30), null, 2))}</pre></div>`;
        }
        if (!incoming.length) return alert("אין שורות תקינות לייבוא");
        const db = JOKLOB.data.load();
        const merged = JOKLOB.data.mergeDraws(replace ? [] : db.draws, incoming, { replace });
        const next = {
          version: (db.version || 1) + 1,
          updatedAt: new Date().toISOString(),
          sourceLabel: `ייבוא משתמש · v${(db.version || 1) + 1} · ${new Date().toLocaleDateString("he-IL")}`,
          draws: merged.draws,
          isDemo: false,
        };
        JOKLOB.data.save(next);
        alert(`נוספו ${merged.added}, כפולים שדולגו ${merged.duplicates}. סה״כ ${merged.draws.length}`);
        go("upload");
      };
      root.querySelector("#import-merge")?.addEventListener("click", () => doImport(false));
      root.querySelector("#import-replace")?.addEventListener("click", () => doImport(true));
      root.querySelector("#reset-demo")?.addEventListener("click", () => {
        JOKLOB.data.save({
          version: 1,
          updatedAt: new Date().toISOString(),
          sourceLabel: "מאגר הדגמה סינתטי 6/37",
          draws: JOKLOB.data.makeDemoFormat37(400),
          isDemo: true,
        });
        go("upload");
      });
    }

    if (state.route === "backtest") {
      root.querySelector("#bt-run")?.addEventListener("click", () => {
        const { draws } = JOKLOB.generator.getDraws("format37");
        const out = JOKLOB.backtest.run(draws, {
          horizon: Number(root.querySelector("#bt-h").value || 20),
          tickets: Number(root.querySelector("#bt-t").value || 3),
        });
        root.querySelector("#bt-out").innerHTML = `
          <div class="card">
            <p><span class="chip">סימולציה / בדיקת עבר</span></p>
            <p>${JOKLOB.ui.esc(out.note)}</p>
            <pre>${JOKLOB.ui.esc(JSON.stringify(out.summary, null, 2))}</pre>
            <p><b>מסקנה:</b> ${JOKLOB.ui.esc(out.summary.verdict)}</p>
          </div>`;
      });
    }

    if (state.route === "r-period") {
      root.querySelector("#save-period")?.addEventListener("click", () => {
        const period = root.querySelector("#period-pick").value;
        const from = root.querySelector("#custom-from").value;
        const to = root.querySelector("#custom-to").value;
        localStorage.setItem("joklob_custom_period", JSON.stringify({ from, to }));
        const d = JOKLOB.storage.get();
        d.period = period;
        JOKLOB.storage.save(d);
        const { draws } = JOKLOB.generator.getDraws(period);
        root.querySelector("#period-status").textContent =
          `נשמר: ${period} · ${draws.length} הגרלות במדגם הפעיל`;
      });
    }

    if (state.route === "r-compare") {
      root.querySelector("#cmp-run")?.addEventListener("click", () => {
        const seed = root.querySelector("#cmp-seed").value.trim() || JOKLOB.rng.newSeed();
        const period = JOKLOB.storage.get().period || "format37";
        const methods = Object.keys(JOKLOB.generator.METHODS);
        const rows = methods.map((method) => {
          const batch = JOKLOB.generator.generate({
            method,
            period,
            count: 1,
            mode: "regular",
            seed,
            experimentalMode: "seed_only",
          });
          const t = batch.tickets[0];
          return {
            method,
            label: t.methodLabel,
            numbers: t.numbers,
            strong: t.strong,
            researchScore: t.researchScore,
            kind: t.kind,
            sum: t.signature?.sum,
          };
        });
        const d = JOKLOB.storage.get();
        d.compare.unshift({ at: new Date().toISOString(), seed, period, rows });
        d.compare = d.compare.slice(0, 20);
        JOKLOB.storage.save(d);
        root.querySelector("#cmp-out").innerHTML = `
          <p>Seed משותף: <span dir="ltr">${JOKLOB.ui.esc(seed)}</span></p>
          <pre>${JOKLOB.ui.esc(JSON.stringify(rows, null, 2))}</pre>
          <p class="muted">ציון התאמה למודל ≠ סיכוי זכייה. השוואה מבנית בלבד.</p>`;
      });
    }

    if (state.route === "r-pdf") {
      root.querySelector("#pdf-last")?.addEventListener("click", () => {
        const batch = state.lastBatch || JOKLOB.storage.get().last;
        const status = root.querySelector("#pdf-status");
        if (!batch?.tickets?.length) {
          status.textContent = "אין אצווה אחרונה — צרו צירוף במחולל קודם.";
          return;
        }
        JOKLOB.pdf.exportBatch(batch);
        status.textContent = "נפתח חלון הדפסה/PDF.";
      });
    }

    if (state.route === "about") {
      root.querySelector("#about-done")?.addEventListener("click", () => {
        localStorage.setItem("joklob_seen_about", "1");
        go("home");
      });
    }

    if (state.route === "more") {
      root.querySelector("#theme-dark")?.addEventListener("click", () => {
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem("joklob_theme", "dark");
      });
      root.querySelector("#theme-light")?.addEventListener("click", () => {
        document.documentElement.dataset.theme = "light";
        localStorage.setItem("joklob_theme", "light");
      });
      root.querySelector("#wipe")?.addEventListener("click", () => {
        if (confirm("למחוק מאגר, שמירות ומשקלים?")) {
          localStorage.removeItem(JOKLOB.data.KEY);
          localStorage.removeItem(JOKLOB.storage.KEY);
          localStorage.removeItem("joklob_fire_w");
          alert("נמחק");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.dataset.theme = localStorage.getItem("joklob_theme") || "dark";
    document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => go(b.dataset.route)));
    document.querySelector("[data-route-about]")?.addEventListener("click", () => go("about"));
    window.addEventListener("hashchange", () => go((location.hash || "#home").slice(1), false));
    const first = !localStorage.getItem("joklob_seen_about");
    const hash = (location.hash || "").slice(1);
    if (first && (!hash || hash === "home")) go("about", true);
    else go(hash || "home", false);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
})();
