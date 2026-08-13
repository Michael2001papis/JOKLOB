/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 */
(() => {
  const state = { route: "home", mode: "regular", lastBatch: null, stack: [] };

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("joklob_theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.innerHTML = theme === "light" ? JOKLOB.icons.moon : JOKLOB.icons.sun;
  }

  function archiveChip() {
    const el = document.getElementById("archive-chip");
    if (!el) return;
    const db = JOKLOB.data.load();
    const short = window.matchMedia("(max-width: 599px)").matches
      ? `${db.isOfficial ? "רשמי" : "מאגר"} · ${(db.draws || []).length}`
      : JOKLOB.ui.archiveShort(db);
    el.textContent = short;
    el.title = db.sourceLabel || "";
  }

  function renderNav() {
    const nav = document.querySelector(".nav");
    if (nav) {
      nav.innerHTML = JOKLOB.nav.main
        .map((m) => `<button type="button" class="nav-btn" data-route="${m.id}" aria-label="${m.he}">
          ${JOKLOB.icons[m.icon] || ""}<span>${m.he}</span></button>`)
        .join("");
      nav.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => go(b.dataset.route)));
    }
    const side = document.getElementById("sidebar");
    if (side) {
      const mains = JOKLOB.nav.main
        .map((m) => `<button type="button" class="side-link" data-route="${m.id}">${JOKLOB.icons[m.icon] || ""}${m.he}</button>`)
        .join("");
      const groups = JOKLOB.nav.groups
        .map((g) => {
          const open = g.items.some((it) => it.id === state.route) || (state.route === "research" && g.id === "status");
          return `<div class="side-group">
            <h3>${g.he}</h3>
            ${g.items.map((it) => `<button type="button" class="side-link" data-route="${it.id}">${JOKLOB.icons[it.icon] || ""}${it.he}</button>`).join("")}
          </div>`;
        })
        .join("");
      side.innerHTML = `<div class="side-group"><h3>ראשי</h3>${mains}</div>${groups}`;
      side.querySelectorAll("[data-route]").forEach((b) => b.addEventListener("click", () => go(b.dataset.route)));
    }
    markActive();
  }

  function markActive() {
    const parent = JOKLOB.nav.parentOf(state.route);
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.route === parent);
    });
    document.querySelectorAll(".sidebar [data-route]").forEach((b) => {
      b.classList.toggle("active", b.dataset.route === state.route || (state.route.startsWith("r-") && b.dataset.route === state.route));
    });
    const crumbs = document.getElementById("crumbs");
    if (crumbs) {
      const parts = ["<button type='button' data-crumb='home'>מחולל</button>"];
      if (parent !== "home") parts.push(`<button type='button' data-crumb='${parent}'>${JOKLOB.nav.titles[parent] || parent}</button>`);
      if (state.route !== parent) parts.push(`<span>${JOKLOB.nav.titles[state.route] || ""}</span>`);
      crumbs.innerHTML = parts.join(" / ");
      crumbs.querySelectorAll("[data-crumb]").forEach((b) => b.addEventListener("click", () => go(b.dataset.crumb)));
    }
  }

  function go(route, push = true) {
    if (!JOKLOB.pages[route]) route = "home";
    if (push && state.route && state.route !== route) {
      state.stack.push({ route: state.route, scroll: window.scrollY });
      if (state.stack.length > 40) state.stack.shift();
    }
    state.route = route;
    if (push) location.hash = route;
    const title = JOKLOB.nav.titles[route] || "JOKLOB";
    const st = document.getElementById("screen-title");
    if (st) st.textContent = title;
    document.title = `${title} — JOKLOB`;
    const root = document.getElementById("content");
    root.innerHTML = JOKLOB.pages[route]();
    bind(root);
    renderNav();
    archiveChip();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack() {
    const prev = state.stack.pop();
    if (!prev) {
      go(JOKLOB.nav.parentOf(state.route) === state.route ? "research" : JOKLOB.nav.parentOf(state.route), true);
      return;
    }
    go(prev.route, false);
    requestAnimationFrame(() => window.scrollTo({ top: prev.scroll, behavior: "auto" }));
  }

  function findTicket(id) {
    return (state.lastBatch?.tickets || []).find((t) => t.calcId === id) ||
      JOKLOB.storage.get().tickets.find((t) => t.calcId === id);
  }

  function collapseForm() {
    const form = document.getElementById("gen-form");
    const edit = document.getElementById("edit-settings");
    if (form) form.classList.add("hidden");
    if (edit) edit.classList.remove("hidden");
  }

  function renderResults(batch) {
    state.lastBatch = batch;
    JOKLOB.storage.setLast(batch);
    const box = document.getElementById("results");
    if (!box) return;
    box.innerHTML = batch.tickets.map((t) => JOKLOB.ui.ticketCard(t)).join("");
    collapseForm();
    bindTicketActions(box);
    const first = box.querySelector(".ticket");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindTicketActions(root) {
    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const id = btn.dataset.id;
        const t = findTicket(id);
        if (btn.dataset.act === "more-menu") {
          const pop = root.querySelector(`[data-menu="${id}"]`);
          document.querySelectorAll(".menu-pop").forEach((p) => { if (p !== pop) p.classList.add("hidden"); });
          pop?.classList.toggle("hidden");
          return;
        }
        if (!t) return;
        if (btn.dataset.act === "save") {
          JOKLOB.storage.saveTicket(t);
          btn.textContent = "נשמר ✓";
          JOKLOB.ui.toast("הצירוף נשמר במכשיר", "ok");
        } else if (btn.dataset.act === "variant") {
          runGenerate({ seed: null });
        } else if (btn.dataset.act === "replay") {
          runGenerate({ seed: t.seed });
        } else if (btn.dataset.act === "pdf-one") {
          JOKLOB.pdf.exportBatch({ ...state.lastBatch, tickets: [t] });
        } else if (btn.dataset.act === "copy-seed") {
          try {
            await navigator.clipboard.writeText(t.seed || "");
            JOKLOB.ui.toast("Seed הועתק", "ok");
          } catch {
            JOKLOB.ui.toast(t.seed || "", "");
          }
        } else if (btn.dataset.act === "show-ver") {
          JOKLOB.ui.toast(`${t.dataVersion?.source || ""} · ${t.dataVersion?.drawsUsed || 0} הגרלות`, "");
        }
      });
    });
  }

  function runGenerate(override = {}) {
    const btn = document.getElementById("generate");
    const method = document.getElementById("method")?.value || "michael_hybrid";
    const period = document.getElementById("period")?.value || JOKLOB.storage.get().period || "format37";
    const count = Number(document.getElementById("count")?.value || 1);
    const exp = document.getElementById("exp-mode")?.value || "seed_only";
    const seedInput = document.getElementById("seed")?.value.trim();
    const d = JOKLOB.storage.get();
    d.period = period;
    d.experimentalMode = exp;
    JOKLOB.storage.save(d);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> מחשב צירוף…`;
    }
    setTimeout(() => {
      try {
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
      } catch (err) {
        JOKLOB.ui.toast("היצירה נכשלה: " + err.message, "bad");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "צור צירוף מחקרי";
        }
      }
    }, 40);
  }

  function bindLists(root) {
    root.querySelectorAll("[data-list]").forEach((box) => {
      JOKLOB.ui.applyListFilter(box);
      box.querySelector("[data-search]")?.addEventListener("input", () => JOKLOB.ui.applyListFilter(box));
      box.querySelector("[data-more]")?.addEventListener("click", () => {
        box.dataset.all = box.dataset.all === "1" ? "0" : "1";
        box.querySelector("[data-more]").textContent = box.dataset.all === "1" ? "הצג פחות" : "הצג הכול";
        JOKLOB.ui.applyListFilter(box);
      });
    });
    root.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        root.querySelectorAll("[data-tab]").forEach((t) => t.classList.toggle("on", t === tab));
        root.querySelectorAll("[data-panel]").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== name));
      });
    });
  }

  async function doImport(root, replace) {
    if (replace) {
      const ok = await JOKLOB.ui.confirm("החלפה תמחק את המאגר הנוכחי ותשים את הייבוא החדש. להמשיך?");
      if (!ok) return;
    }
    let incoming = [];
    const allErrors = [];
    const csv = root.querySelector("#csv")?.value.trim();
    if (csv) {
      const parsed = JOKLOB.data.parseCsv(csv);
      incoming = incoming.concat(parsed.rows);
      allErrors.push(...parsed.errors);
    }
    const manual = root.querySelector("#manual")?.value.trim();
    if (manual) {
      const parsed = JOKLOB.data.parseCsv(manual);
      incoming = incoming.concat(parsed.rows);
      allErrors.push(...parsed.errors);
    }
    const xfile = root.querySelector("#xlsx")?.files?.[0];
    if (xfile) {
      const buf = await xfile.arrayBuffer();
      const parsed = xfile.name.toLowerCase().endsWith(".csv")
        ? JOKLOB.data.parseCsv(new TextDecoder().decode(buf))
        : JOKLOB.data.parseExcel(buf);
      incoming = incoming.concat(parsed.rows);
      allErrors.push(...parsed.errors);
    }
    const pfile = root.querySelector("#pdf")?.files?.[0];
    if (pfile) {
      const parsed = JOKLOB.data.parsePdf(await pfile.arrayBuffer());
      incoming = incoming.concat(parsed.rows);
      allErrors.push(...parsed.errors);
    }
    const box = root.querySelector("#import-errors");
    if (allErrors.length && box) {
      box.innerHTML = `<div class="disclaimer"><b>שגיאות לפני הכנסה:</b><ul>${allErrors.slice(0, 20).map((e) => `<li>${JOKLOB.ui.esc(JSON.stringify(e))}</li>`).join("")}</ul></div>`;
    }
    if (!incoming.length) {
      JOKLOB.ui.toast("אין שורות תקינות לייבוא", "bad");
      return;
    }
    const db = JOKLOB.data.load();
    const merged = JOKLOB.data.mergeDraws(replace ? [] : db.draws, incoming, { replace });
    const ver = (db.version || 1) + 1;
    merged.draws.forEach((d) => { d.researchVersion = d.researchVersion || ver; });
    JOKLOB.data.save({
      version: ver,
      updatedAt: new Date().toISOString(),
      sourceLabel: `ייבוא משתמש על בסיס Lotto.csv · v${ver} · ${new Date().toLocaleDateString("he-IL")}`,
      sourceId: JOKLOB.data.OFFICIAL_ID,
      draws: merged.draws,
      isDemo: false,
      isOfficial: true,
      userUpload: true,
    });
    JOKLOB.ui.toast(`נוספו ${merged.added}, כפולים ${merged.duplicates}. סה״כ ${merged.draws.length}`, "ok");
    go("upload", false);
  }

  async function tidyArchive() {
    const ok = await JOKLOB.ui.confirm("לסדר ולעדכן את המאגר? הגרלות תקינות לא יימחקו. כפילויות ידולגו.");
    if (!ok) return;
    const wrap = document.getElementById("tidy-progress");
    const bar = document.getElementById("tidy-bar");
    const step = document.getElementById("tidy-step");
    const report = document.getElementById("tidy-report");
    wrap?.classList.remove("hidden");
    const set = (p, t) => { if (bar) bar.style.width = p + "%"; if (step) step.textContent = t; };
    await new Promise((r) => setTimeout(r, 30));
    set(10, "בודק את המאגר…");
    const db = JOKLOB.data.load();
    const errors = [];
    const good = [];
    (db.draws || []).forEach((d, i) => {
      if (!d.numbers || d.numbers.length !== 6) errors.push({ i, reason: "אין 6 מספרים" });
      else good.push(d);
    });
    set(30, `נבדקו ${db.draws.length} רשומות`);
    await new Promise((r) => setTimeout(r, 20));
    const merged = JOKLOB.data.mergeDraws([], good, { replace: true });
    set(55, "ממיין ומסיר כפילויות…");
    await new Promise((r) => setTimeout(r, 20));
    const { draws } = JOKLOB.generator.getDraws("format37");
    set(75, "מחשב שכיחויות, אש, לחץ, זוגות וצל…");
    const full = JOKLOB.analyze.fullReport(draws.length ? draws : merged.draws);
    set(90, "שומר גרסת מחקר…");
    const ver = (db.version || 1) + 1;
    merged.draws.forEach((d) => { d.researchVersion = ver; });
    JOKLOB.data.save({
      ...db,
      version: ver,
      updatedAt: new Date().toISOString(),
      sourceLabel: db.sourceLabel || `מאגר מסודר v${ver}`,
      draws: merged.draws,
      lastTidy: new Date().toISOString(),
    });
    set(100, "הושלם");
    if (report) {
      report.innerHTML = `<div class="card"><h2>דוח שינויים</h2>
        <p>נבדקו: ${db.draws.length} · תקינות: ${good.length} · כפילויות שדולגו: ${merged.duplicates}</p>
        <p>שגיאות מבנה: ${errors.length} · במאגר אחרי סידור: ${merged.draws.length}</p>
        <p>מדגם 6/37 מחושב: ${full.sampleSize} · עודכן: ${new Date().toLocaleString("he-IL")}</p></div>`;
    }
    JOKLOB.ui.toast("המאגר סודר והמדדים עודכנו", "ok");
    archiveChip();
  }

  function bind(root) {
    root.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
    root.querySelectorAll("[data-go-back]").forEach((el) => el.addEventListener("click", goBack));
    bindLists(root);

    if (state.route === "home") {
      root.querySelectorAll("#mode-seg button").forEach((b) => {
        b.addEventListener("click", () => {
          root.querySelectorAll("#mode-seg button").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          state.mode = b.dataset.mode;
        });
      });
      const period = JOKLOB.storage.get().period || "format37";
      const sel = root.querySelector("#period");
      if (sel) sel.value = period;
      root.querySelector("#generate")?.addEventListener("click", () => runGenerate({}));
      root.querySelector("#edit-settings")?.addEventListener("click", () => {
        root.querySelector("#gen-form")?.classList.remove("hidden");
        root.querySelector("#edit-settings")?.classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      root.querySelector("#welcome-start")?.addEventListener("click", () => {
        localStorage.setItem("joklob_seen_about", "1");
        root.querySelector("#welcome-card")?.remove();
      });
      root.querySelector("#welcome-skip")?.addEventListener("click", () => {
        localStorage.setItem("joklob_seen_about", "1");
        root.querySelector("#welcome-card")?.remove();
      });
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
        go("r-fire", false);
        JOKLOB.ui.toast("המשקלים נשמרו", "ok");
      });
    }

    if (state.route === "upload") {
      const zone = root.querySelector("#drop-zone");
      const fileInput = root.querySelector("#xlsx");
      zone?.addEventListener("click", () => fileInput?.click());
      zone?.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("on"); });
      zone?.addEventListener("dragleave", () => zone.classList.remove("on"));
      zone?.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("on");
        if (e.dataTransfer.files[0] && fileInput) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event("change"));
        }
      });
      fileInput?.addEventListener("change", () => {
        const f = fileInput.files?.[0];
        const name = root.querySelector("#file-name");
        const prev = root.querySelector("#file-preview");
        if (f && name) name.textContent = `${f.name} · ${(f.size / 1024).toFixed(1)} ק״ב · ${f.type || "קובץ"}`;
        if (prev) prev.textContent = f ? "הקובץ מוכן לייבוא. בחרו המשך או החלפה." : "";
      });
      root.querySelector("#import-merge")?.addEventListener("click", () => doImport(root, false));
      root.querySelector("#import-replace")?.addEventListener("click", () => doImport(root, true));
      root.querySelector("#tidy-run")?.addEventListener("click", () => tidyArchive());
      root.querySelector("#reset-demo")?.addEventListener("click", async () => {
        const ok = await JOKLOB.ui.confirm("לטעון מחדש את המאגר הרשמי מ-file/Lotto.csv?");
        if (!ok) return;
        try {
          await JOKLOB.data.ensureOfficial(true);
          JOKLOB.ui.toast("המאגר הרשמי נטען מחדש", "ok");
          go("upload", false);
        } catch (err) {
          JOKLOB.ui.toast("טעינה נכשלה: " + err.message, "bad");
        }
      });
      root.querySelector("#reload-official")?.addEventListener("click", async () => {
        try {
          const out = await JOKLOB.data.ensureOfficial(true);
          JOKLOB.ui.toast(`נטען מאגר רשמי: ${out.db.draws.length} הגרלות`, "ok");
          go("upload", false);
        } catch (err) {
          JOKLOB.ui.toast("טעינה נכשלה: " + err.message, "bad");
        }
      });
    }

    if (state.route === "backtest") {
      root.querySelector("#bt-run")?.addEventListener("click", () => {
        const btn = root.querySelector("#bt-run");
        const busy = root.querySelector("#bt-busy");
        btn.disabled = true;
        busy?.classList.remove("hidden");
        setTimeout(() => {
          try {
            const { draws } = JOKLOB.generator.getDraws("format37");
            const out = JOKLOB.backtest.run(draws, {
              horizon: Number(root.querySelector("#bt-h").value || 20),
              tickets: Number(root.querySelector("#bt-t").value || 3),
            });
            const s = out.summary;
            const chart = JOKLOB.charts.cols(
              [
                { l: "מודל", v: s.hybridAvgHit },
                { l: "אקראי", v: s.randomAvgHit },
              ],
              { title: "ממוצע התאמות — מודל מול אקראי" }
            );
            root.querySelector("#bt-out").innerHTML = `
              <div class="card">
                <p><span class="chip">סימולציה / בדיקת עבר</span></p>
                <div class="stat-grid">
                  <div class="stat"><span>נקודות</span><b>${s.trials}</b></div>
                  <div class="stat"><span>ממוצע מודל</span><b>${Number(s.hybridAvgHit).toFixed(3)}</b></div>
                  <div class="stat"><span>ממוצע אקראי</span><b>${Number(s.randomAvgHit).toFixed(3)}</b></div>
                  <div class="stat"><span>פגיעת חזק</span><b>${(s.hybridStrongRate * 100).toFixed(1)}%</b></div>
                </div>
                <p>טווח ביטחון מודל: ${s.hybridHitCI.map((x) => Number(x).toFixed(3)).join(" – ")}</p>
                <p><b>מסקנה:</b> ${JOKLOB.ui.esc(s.verdict)}</p>
                ${chart}
                <details><summary>נתונים טכניים</summary><pre>${JOKLOB.ui.esc(JSON.stringify(s, null, 2))}</pre></details>
              </div>`;
          } catch (err) {
            JOKLOB.ui.toast("הבדיקה נכשלה: " + err.message, "bad");
          } finally {
            btn.disabled = false;
            busy?.classList.add("hidden");
          }
        }, 40);
      });
    }

    if (state.route === "r-world") {
      root.querySelector("#save-world")?.addEventListener("click", () => {
        JOKLOB.world.saveExtra({
          volatility: root.querySelector("#world-vol").value,
          events: root.querySelector("#world-ev").value,
        });
        JOKLOB.ui.toast("ההזנה נשמרה", "ok");
        go("r-world", false);
      });
    }

    if (state.route === "r-period") {
      root.querySelector("#save-period")?.addEventListener("click", () => {
        const period = root.querySelector("#period-pick").value;
        localStorage.setItem("joklob_custom_period", JSON.stringify({
          from: root.querySelector("#custom-from").value,
          to: root.querySelector("#custom-to").value,
        }));
        const d = JOKLOB.storage.get();
        d.period = period;
        JOKLOB.storage.save(d);
        const { draws } = JOKLOB.generator.getDraws(period);
        root.querySelector("#period-status").textContent = `נשמר: ${period} · ${draws.length} הגרלות`;
        JOKLOB.ui.toast("התקופה נשמרה", "ok");
      });
    }

    if (state.route === "r-compare") {
      root.querySelector("#cmp-run")?.addEventListener("click", () => {
        const btn = root.querySelector("#cmp-run");
        const busy = root.querySelector("#cmp-busy");
        btn.disabled = true;
        busy?.classList.remove("hidden");
        setTimeout(() => {
          const seed = root.querySelector("#cmp-seed").value.trim() || JOKLOB.rng.newSeed();
          const period = JOKLOB.storage.get().period || "format37";
          const rows = Object.keys(JOKLOB.generator.METHODS).map((method) => {
            const batch = JOKLOB.generator.generate({
              method, period, count: 1, mode: "regular", seed, experimentalMode: "seed_only",
            });
            const t = batch.tickets[0];
            return {
              method, label: t.methodLabel, numbers: t.numbers, strong: t.strong,
              researchScore: t.researchScore, kind: t.kind, sum: t.signature?.sum,
            };
          });
          const d = JOKLOB.storage.get();
          d.compare.unshift({ at: new Date().toISOString(), seed, period, rows });
          d.compare = d.compare.slice(0, 20);
          JOKLOB.storage.save(d);
          root.querySelector("#cmp-out").innerHTML = `
            <p>Seed: <span dir="ltr">${JOKLOB.ui.esc(seed)}</span></p>
            ${JOKLOB.ui.dataList({
              id: "cmp-now",
              columns: [
                { key: "label", he: "מודל" }, { key: "numbers", he: "מספרים" },
                { key: "strong", he: "חזק" }, { key: "score", he: "ציון" }, { key: "sum", he: "סכום" },
              ],
              rows: rows.map((r) => ({
                label: r.label, numbers: (r.numbers || []).join("-"), strong: r.strong,
                score: Number(r.researchScore || 0).toFixed(3), sum: r.sum,
              })),
              cardKeys: ["label", "numbers", "strong", "score"],
            })}
            <p class="muted">ציון התאמה למודל ≠ סיכוי זכייה.</p>`;
          bindLists(root);
          btn.disabled = false;
          busy?.classList.add("hidden");
        }, 40);
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

    if (state.route === "r-history") {
      root.querySelectorAll("[data-hist]").forEach((el) => {
        el.addEventListener("click", () => {
          const x = JOKLOB.storage.get().history[Number(el.dataset.hist)];
          if (!x) return;
          const box = root.querySelector("#hist-detail");
          box.innerHTML = `<div class="card">
            ${x.numbers ? JOKLOB.ui.balls(x.numbers, x.strong) : ""}
            <p>מודל: ${JOKLOB.ui.esc(x.methodLabel || x.method)}</p>
            <p>תאריך: ${new Date(x.at).toLocaleString("he-IL")}</p>
            <p>Seed: <span dir="ltr">${JOKLOB.ui.esc(x.seed)}</span></p>
            <p>מאגר: ${JOKLOB.ui.esc(x.dataVersion?.source || "—")}</p>
            <div class="actions">
              <button type="button" class="btn" id="hist-replay">שחזור</button>
              <button type="button" class="btn danger" id="hist-del">מחיקה</button>
            </div>
          </div>`;
          box.querySelector("#hist-replay")?.addEventListener("click", () => {
            go("home");
            setTimeout(() => {
              const seed = document.getElementById("seed");
              if (seed) seed.value = x.seed || "";
              runGenerate({ seed: x.seed });
            }, 50);
          });
          box.querySelector("#hist-del")?.addEventListener("click", async () => {
            const ok = await JOKLOB.ui.confirm("למחוק רשומה זו מההיסטוריה?");
            if (!ok) return;
            const d = JOKLOB.storage.get();
            d.history.splice(Number(el.dataset.hist), 1);
            JOKLOB.storage.save(d);
            go("r-history", false);
          });
        });
      });
    }

    if (state.route === "more") {
      root.querySelector("#wipe")?.addEventListener("click", async () => {
        const ok = await JOKLOB.ui.confirm("למחוק מאגר, שמירות ומשקלים במכשיר זה?");
        if (!ok) return;
        localStorage.removeItem(JOKLOB.data.KEY);
        localStorage.removeItem(JOKLOB.storage.KEY);
        localStorage.removeItem("joklob_fire_w");
        JOKLOB.ui.toast("הנתונים המקומיים נמחקו", "ok");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setTheme(localStorage.getItem("joklob_theme") || "dark");
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
    document.getElementById("help-btn").innerHTML = JOKLOB.icons.help;
    document.getElementById("help-btn")?.addEventListener("click", () => go("about"));
    document.getElementById("archive-chip")?.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 599px)").matches) {
        JOKLOB.ui.toast(JOKLOB.ui.archiveShort(JOKLOB.data.load()), "");
      } else go("upload");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".menu")) document.querySelectorAll(".menu-pop").forEach((p) => p.classList.add("hidden"));
    });
    window.addEventListener("hashchange", () => go((location.hash || "#home").slice(1), false));
    const hash = (location.hash || "").slice(1);
    go(hash || "home", false);
    try {
      const out = await JOKLOB.data.ensureOfficial(false);
      if (out.changed) go(state.route, false);
      archiveChip();
    } catch (err) {
      console.warn("official archive", err);
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
})();
