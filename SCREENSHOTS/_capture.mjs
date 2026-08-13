import { chromium } from "playwright";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = "http://127.0.0.1:4173/HTML/";
const SHOTS = [
  { id: "01-home-before", hash: "home" },
  { id: "02-home-after", hash: "home", afterGenerate: true },
  { id: "03-research", hash: "research" },
  { id: "04-upload", hash: "upload" },
  { id: "05-freq", hash: "r-freq" },
  { id: "06-fire", hash: "r-fire" },
  { id: "07-pressure", hash: "r-pressure" },
  { id: "08-pairs", hash: "r-pairs" },
  { id: "09-shadow", hash: "r-shadow" },
  { id: "10-backtest", hash: "backtest" },
  { id: "11-more", hash: "more" },
  { id: "12-about", hash: "about" },
];
const WIDTHS = [
  { w: 360, h: 800, tag: "360" },
  { w: 1366, h: 768, tag: "1366" },
];

async function waitOfficial(page) {
  await page.waitForFunction(() => {
    try {
      const db = JSON.parse(localStorage.getItem("joklob_research_db_v2") || "{}");
      return Array.isArray(db.draws) && db.draws.length > 1000;
    } catch { return false; }
  }, { timeout: 45000 });
}

async function shot(page, width, name) {
  const h = await page.evaluate(() => Math.min(Math.max(document.querySelector(".app")?.scrollHeight || 800, 800), 5000));
  await page.setViewportSize({ width, height: h });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(__dir, `${name}.png`), fullPage: false });
  console.log("saved", name, width, "x", h);
}

const browser = await chromium.launch({ headless: true });
for (const vw of WIDTHS) {
  const context = await browser.newContext({ viewport: { width: vw.w, height: vw.h }, locale: "he-IL" });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("joklob_seen_about", "1");
    localStorage.setItem("joklob_theme", "dark");
  });
  await page.goto(BASE + "#home", { waitUntil: "domcontentloaded" });
  await waitOfficial(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitOfficial(page);
  for (const s of SHOTS) {
    await page.setViewportSize({ width: vw.w, height: vw.h });
    await page.goto(BASE + "#" + s.hash, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    if (s.afterGenerate) {
      await page.click("#generate");
      await page.waitForSelector(".ticket", { timeout: 60000 });
    }
    await shot(page, vw.w, `${s.id}-${vw.tag}`);
  }
  await context.close();
}
await browser.close();
console.log("done");
