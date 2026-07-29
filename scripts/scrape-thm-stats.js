// scripts/scrape-thm-stats.js
//
// Run by .github/workflows/update-thm-stats.yml on a cron schedule.
//
// Previous approach used headless Chrome (Puppeteer) to render the profile
// page and scrape visible label text. That broke because TryHackMe's site
// sits behind a Vercel bot-verification checkpoint that blocks headless
// browsers before the real page ever loads.
//
// This version hits TryHackMe's own public JSON API directly instead —
// the same endpoint their profile page's frontend calls under the hood:
//   GET https://tryhackme.com/api/v2/public-profile?username=<username>
// It's unauthenticated and returns clean JSON (rank, streak, points,
// completed rooms, badge count) with no rendering or bot-detection
// involved. Confirmed via browser DevTools network inspection.
//
// Graceful fallback: if the request fails, times out, or the response
// shape is unexpected, we do NOT overwrite thm-stats.json with blanks.
// We keep the previous committed values and just flag `stale: true` with
// an updated `lastAttempt` timestamp, so the site never shows broken UI —
// it just pauses auto-updating until the next successful run.

const fs = require("fs");
const path = require("path");

const USERNAME = "demonslave738";
const API_URL = `https://tryhackme.com/api/v2/public-profile?username=${USERNAME}`;
const OUTPUT_PATH = path.join(__dirname, "..", "thm-stats.json");

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  } catch {
    return { rank: null, points: null, roomsCompleted: null, badges: null, streak: null };
  }
}

(async () => {
  const existing = loadExisting();
  const now = new Date().toISOString();

  try {
    const res = await fetch(API_URL, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Referer": `https://tryhackme.com/p/${USERNAME}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const json = await res.json();

    if (json.status !== "success" || !json.data) {
      throw new Error(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`);
    }

    const d = json.data;

    const result = {
      rank: typeof d.rank === "number" ? d.rank : existing.rank,
      points: typeof d.totalPoints === "number" ? d.totalPoints : existing.points,
      roomsCompleted: typeof d.completedRoomsNumber === "number" ? d.completedRoomsNumber : existing.roomsCompleted,
      badges: typeof d.badgesNumber === "number" ? d.badgesNumber : existing.badges,
      streak: typeof d.streak === "number" ? d.streak : existing.streak,
      stale: false,
      lastUpdated: now
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
    console.log("Updated thm-stats.json:", result);
  } catch (err) {
    const fallback = { ...existing, stale: true, lastAttempt: now, error: String(err.message || err) };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fallback, null, 2));
    console.error("Fetch failed, kept last known-good values:", err);
  }
})();