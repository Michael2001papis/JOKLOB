import { chromium } from "playwright";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = "http://127.0.0.1:4173/HTML/";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, locale: "he-IL" });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("joklob_seen_about", "1");
  localStorage.setItem("joklob_theme", "dark");
});
await page.goto(BASE + "#home", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => {
  try {
    const db = JSON.parse(localStorage.getItem("joklob_research_db_v2") || "{}");
    return Array.isArray(db.draws) && db.draws.length > 1000;
  } catch { return false; }
}, { timeout: 45000 });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => {
  try {
    const db = JSON.parse(localStorage.getItem("joklob_research_db_v2") || "{}");
    return Array.isArray(db.draws) && db.draws.length > 1000;
  } catch { return false; }
}, { timeout: 45000 });

async function measure(name) {
  const m = await page.evaluate(() => {
    const gen = document.getElementById("generate");
    const r = gen ? gen.getBoundingClientRect() : null;
    const ticket = document.querySelector(".ticket");
    const balls = document.querySelector(".balls");
    return {
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      appW: document.querySelector(".app")?.scrollWidth,
      topbarW: document.querySelector(".topbar")?.scrollWidth,
      genBottom: r ? Math.round(r.bottom) : null,
      genVisible: r ? r.top >= 0 && r.bottom <= 800 : null,
      title: document.getElementById("screen-title")?.offsetParent ? "shown" : "hidden",
      chip: document.getElementById("archive-chip")?.textContent,
      chipW: Math.round(document.getElementById("archive-chip")?.getBoundingClientRect().width || 0),
      ballsW: balls ? Math.round(balls.scrollWidth) : null,
      ticketW: ticket ? Math.round(ticket.scrollWidth) : null,
    };
  });
  console.log(name, JSON.stringify(m));
}

const shots = [
  ["home", "home"],
  ["research", "research"],
  ["upload", "upload"],
  ["r-freq", "freq"],
  ["r-pairs", "pairs"],
];
for (const [hash, name] of shots) {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(BASE + "#" + hash, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(400);
  await measure(name);
  await page.screenshot({ path: join(__dir, `fix-${name}-360.png`) });
}
await page.goto(BASE + "#home", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#generate");
await page.click("#generate");
await page.waitForSelector(".ticket", { timeout: 60000 });
await page.waitForTimeout(300);
await measure("home-after");
await page.screenshot({ path: join(__dir, "fix-home-after-360.png") });
await browser.close();
