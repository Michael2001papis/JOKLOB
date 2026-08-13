/**
 * Capture JOKLOB UI at true 360px and 1366px widths.
 * Avoids Playwright fullPage + fixed-centered-nav scrollWidth inflation.
 */
import { chromium } from "playwright";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = "http://127.0.0.1:4173/HTML/";

const SHOTS = [
  { id: "01-home-before", hash: "home", afterGenerate: false },
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
      return Array.isArray(db.draws) && db.draws.length > 1000 && db.isOfficial;
    } catch {
      return false;
    }
  }, { timeout: 45000 });
}

async function shot(page, width, name) {
  await page.evaluate(() => {
    const hide = document.querySelector(".copyright-src");
    if (hide) hide.style.display = "none";
    document.documentElement.style.overflowX = "hidden";
  });
  const appH = await page.evaluate(() => {
    const app = document.querySelector(".app");
    const nav = document.querySelector(".nav");
    const top = app ? app.getBoundingClientRect().top + window.scrollY : 0;
    const bottom = Math.max(
      app ? app.scrollHeight + top : 0,
      document.querySelector("footer")?.getBoundingClientRect().bottom + window.scrollY || 0,
      nav ? window.scrollY + window.innerHeight : 0
    );
    return Math.ceil(Math.max(document.querySelector(".app")?.scrollHeight || 0, window.innerHeight, bottom));
  });
  const h = Math.min(Math.max(appH + 8, 800), 6000);
  await page.setViewportSize({ width, height: h });
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(__dir, `${name}.png`), fullPage: false });
  console.log("saved", name, width, "x", h);
}

async function runWidth(browser, { w, h, tag }) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    locale: "he-IL",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("joklob_seen_about", "1");
    localStorage.setItem("joklob_theme", "dark");
    const hideCopy = () => {
      const el = document.querySelector(".copyright-src");
      if (el) el.style.setProperty("display", "none", "important");
    };
    document.addEventListener("DOMContentLoaded", hideCopy);
  });
  await page.goto(BASE + "#home", { waitUntil: "domcontentloaded" });
  await waitOfficial(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitOfficial(page);

  for (const s of SHOTS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + "#" + s.hash, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 15000 });
    if (s.afterGenerate) {
      await page.click("#generate");
      await page.waitForSelector(".ticket", { timeout: 60000 });
      await page.waitForTimeout(300);
    }
    await shot(page, w, `${s.id}-${tag}`);
  }
  await context.close();
}

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb"],
});
for (const vw of WIDTHS) await runWidth(browser, vw);
await browser.close();
console.log("done");
