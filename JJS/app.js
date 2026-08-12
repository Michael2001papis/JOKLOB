(() => {
  const state = {
    route: "home",
    mode: "regular",
    lastBatch: null,
  };

  const titles = {
    home: "יצירה",
    weights: "משקלים",
    saved: "שמורים",
    data: "נתונים",
    more: "עוד",
  };

  function go(route, push = true) {
    if (!JOKLOB.pages[route]) route = "home";
    state.route = route;
    if (push) location.hash = route;
    document.getElementById("screen-title").textContent = titles[route] || "";
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.route === route);
    });
    const root = document.getElementById("content");
    root.innerHTML = JOKLOB.pages[route]();
    bind(root);
  }

  function findTicket(calcId) {
    const batch = state.lastBatch || JOKLOB.storage.get().last;
    const fromBatch = batch?.tickets?.find((t) => t.calcId === calcId);
    if (fromBatch) return fromBatch;
    return JOKLOB.storage.get().tickets.find((t) => t.calcId === calcId);
  }

  function renderResults(batch) {
    state.lastBatch = batch;
    JOKLOB.storage.setLast(batch);
    const box = document.getElementById("results");
    if (!box) return;
    box.innerHTML = batch.tickets.map((t) => JOKLOB.ui.ticketCard(t, { mode: batch.mode })).join("");
    const ba = document.getElementById("batch-actions");
    if (ba) ba.style.display = "grid";
    bindTicketActions(box);
  }

  function bindTicketActions(root) {
    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = findTicket(btn.dataset.id);
        if (!t) return;
        const act = btn.dataset.act;
        if (act === "save") {
          JOKLOB.storage.saveTicket(t);
          btn.textContent = "נשמר ✓";
        } else if (act === "compare") {
          JOKLOB.storage.toggleCompare(t);
          btn.textContent = "בהשוואה";
        } else if (act === "variant") {
          const batch = JOKLOB.generator.generate({
            method: t.method,
            count: 1,
            mode: "regular",
            seed: null,
          });
          // keep as single replacement view append
          const cur = state.lastBatch || { mode: "regular", method: t.method, tickets: [], createdAt: new Date().toISOString() };
          cur.tickets = [...batch.tickets, ...(cur.tickets || [])].slice(0, 40);
          cur.seed = batch.seed;
          cur.method = batch.method;
          cur.createdAt = batch.createdAt;
          renderResults(cur);
        } else if (act === "replay") {
          const batch = JOKLOB.generator.generate({
            method: t.method,
            count: state.lastBatch?.count || 1,
            mode: state.lastBatch?.mode || "regular",
            seed: t.seed,
          });
          renderResults(batch);
        }
      });
    });
  }

  function bind(root) {
    if (state.route === "home") {
      const methodEl = root.querySelector("#method");
      const expNote = root.querySelector("#exp-note");
      const syncExp = () => {
        const exp = !!JOKLOB.generator.METHODS[methodEl.value]?.experimental;
        expNote.classList.toggle("hidden", !exp);
      };
      methodEl.addEventListener("change", syncExp);
      syncExp();

      root.querySelectorAll("#mode-seg button").forEach((b) => {
        b.addEventListener("click", () => {
          root.querySelectorAll("#mode-seg button").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          state.mode = b.dataset.mode;
        });
      });

      const run = (seedOverride) => {
        const count = Math.max(1, Math.min(20, Number(root.querySelector("#count").value) || 1));
        const seed = seedOverride != null ? seedOverride : (root.querySelector("#seed").value.trim() || null);
        const batch = JOKLOB.generator.generate({
          method: methodEl.value,
          count,
          mode: state.mode,
          seed,
        });
        renderResults(batch);
      };

      root.querySelector("#generate").addEventListener("click", () => run(null));
      root.querySelector("#pdf-btn")?.addEventListener("click", () => {
        if (state.lastBatch) JOKLOB.pdf.exportBatch(state.lastBatch);
      });
      root.querySelector("#regen-btn")?.addEventListener("click", () => run(null));

      const last = JOKLOB.storage.get().last;
      if (last?.tickets?.length) renderResults(last);
    }

    if (state.route === "weights") {
      root.querySelectorAll("input[type=range][data-w]").forEach((el) => {
        el.addEventListener("input", () => {
          root.querySelector(`[data-wv="${el.dataset.w}"]`).textContent = Number(el.value).toFixed(2);
        });
      });
      root.querySelector("#save-weights").addEventListener("click", () => {
        const w = { ...JOKLOB.metrics.defaults };
        root.querySelectorAll("input[type=range][data-w]").forEach((el) => {
          w[el.dataset.w] = Number(el.value);
        });
        JOKLOB.metrics.saveWeights(w);
        alert("המשקלים נשמרו");
      });
      root.querySelector("#reset-weights").addEventListener("click", () => {
        JOKLOB.metrics.saveWeights(JOKLOB.metrics.defaults);
        go("weights");
      });
    }

    if (state.route === "saved") {
      root.querySelectorAll("[data-show]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const t = JOKLOB.storage.get().tickets.find((x) => x.calcId === btn.dataset.show);
          if (t) root.querySelector("#saved-detail").innerHTML = JOKLOB.ui.ticketCard(t);
          bindTicketActions(root.querySelector("#saved-detail"));
        });
      });
      bindTicketActions(root);
    }

    if (state.route === "data") {
      root.querySelector("#import-csv").addEventListener("click", () => {
        const rows = JOKLOB.history.parseCsv(root.querySelector("#csv").value);
        if (!rows.length) {
          alert("לא נמצאו שורות תקינות");
          return;
        }
        JOKLOB.history.save(rows);
        go("data");
      });
      root.querySelector("#reset-demo").addEventListener("click", () => {
        JOKLOB.history.save(JOKLOB.history.makeDemo(180));
        go("data");
      });
    }

    if (state.route === "more") {
      root.querySelector("#theme-dark").addEventListener("click", () => {
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem("joklob_theme", "dark");
      });
      root.querySelector("#theme-light").addEventListener("click", () => {
        document.documentElement.dataset.theme = "light";
        localStorage.setItem("joklob_theme", "light");
      });
      root.querySelector("#wipe").addEventListener("click", () => {
        if (confirm("למחוק שמירות, משקלים ונתוני הגרלות?")) {
          localStorage.removeItem("joklob_saved_v2");
          localStorage.removeItem("joklob_weights");
          localStorage.removeItem("joklob_draws");
          alert("נמחק");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.dataset.theme = localStorage.getItem("joklob_theme") || "dark";
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => go(btn.dataset.route));
    });
    window.addEventListener("hashchange", () => go((location.hash || "#home").slice(1), false));
    go((location.hash || "#home").slice(1), false);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  });
})();
