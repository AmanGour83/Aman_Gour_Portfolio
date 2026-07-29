// scripts/scrape-thm-stats.js
//
// Run by .github/workflows/update-thm-stats.yml on a cron schedule.
//
// Why this exists: TryHackMe's profile page (and the old badge/embed image
// endpoint) is a React SPA — a plain HTTP fetch returns an empty shell with
// no stats in the raw HTML. This script uses headless Chrome to actually
// render the page, then reads stats by MATCHING VISIBLE LABEL TEXT
// ("Rooms Completed", "Rank", "Badges", "Points") rather than hardcoding
// CSS class names, since React apps regenerate class names on every deploy
// and label-based extraction survives redesigns much better.
//
// Graceful fallback: if the page structure has changed enough that a label
// can't be found, we do NOT overwrite thm-stats.json with blanks/zeros.
// We keep the previous committed values and just flag `stale: true` with
// an updated `lastAttempt` timestamp, so the site never shows broken UI —
// it just pauses auto-updating until the next successful run.

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const PROFILE_URL = "https://tryhackme.com/p/demonslave738";
const OUTPUT_PATH = path.join(__dirname, "..", "thm-stats.json");

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  } catch {
    return { rank: null, points: null, roomsCompleted: null, badges: null, streak: null };
  }
}

async function extractByLabel(page, labelPattern) {
  return page.evaluate((pattern) => {
    const re = new RegExp(pattern, "i");
    const all = Array.from(document.querySelectorAll("body *"));

    // Find the smallest/leaf-most element whose own text matches the label,
    // to avoid matching a big container that wraps the whole stats block.
    const labelEl = all.find(el => {
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join(" ")
        .trim();
      return ownText && re.test(ownText) && el.children.length === 0;
    }) || all.find(el => el.children.length === 0 && re.test(el.textContent || ""));

    if (!labelEl) return null;

    const numberFrom = (str) => {
      if (!str) return null;
      const m = str.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
      return m ? m[0] : null;
    };

    // Look in a small neighborhood: parent, previous/next siblings,
    // and the parent's siblings — one of these usually holds the number
    // that the label describes.
    const candidates = [];
    if (labelEl.parentElement) {
      candidates.push(labelEl.parentElement.textContent);
      candidates.push(labelEl.previousElementSibling?.textContent);
      candidates.push(labelEl.nextElementSibling?.textContent);
      const grandparent = labelEl.parentElement.parentElement;
      if (grandparent) {
        candidates.push(grandparent.previousElementSibling?.textContent);
        candidates.push(grandparent.nextElementSibling?.textContent);
      }
    }

    for (const c of candidates) {
      const n = numberFrom(c);
      if (n !== null) return n;
    }
    return null;
  }, labelPattern);
}

(async () => {
  const existing = loadExisting();
  const now = new Date().toISOString();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    );
    await page.goto(PROFILE_URL, { waitUntil: "networkidle2", timeout: 45000 });
    // Give the SPA a little extra time to hydrate/render past initial load.
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(__dirname, "..", "debug-screenshot.png"), fullPage: true });
    

    const rank = await extractByLabel(page, "rank");
    const points = await extractByLabel(page, "points");
const roomsCompleted = await extractByLabel(page, "completed rooms|rooms completed");
const badges = await extractByLabel(page, "badges");
const streak = await extractByLabel(page, "streak");
    await browser.close();

    const gotAnything = [rank, points, roomsCompleted, badges, streak].some(v => v !== null);

    if (!gotAnything) {
      // Structure likely changed — don't clobber good data, just flag it.
      const fallback = { ...existing, stale: true, lastAttempt: now };
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fallback, null, 2));
      console.warn("No stats matched on the page — keeping last known-good values, marked stale.");
      return;
    }

    const result = {
      rank: rank ?? existing.rank,
      points: points !== null ? Number(points) : existing.points,
      roomsCompleted: roomsCompleted !== null ? Number(roomsCompleted) : existing.roomsCompleted,
      badges: badges !== null ? Number(badges) : existing.badges,
      streak: streak !== null ? Number(streak) : existing.streak,
      stale: false,
      lastUpdated: now
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
    console.log("Updated thm-stats.json:", result);
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    const fallback = { ...existing, stale: true, lastAttempt: now, error: String(err.message || err) };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fallback, null, 2));
    console.error("Scrape failed, kept last known-good values:", err);
  }
})();
