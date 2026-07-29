// scripts/scrape-thm-stats.js
//
// Run by .github/workflows/update-thm-stats.yml on a cron schedule.
//
// Hits TryHackMe's own public JSON API directly (the same endpoint their
// profile page's frontend calls under the hood):
//   GET https://tryhackme.com/api/v2/public-profile?username=<username>
// Unauthenticated, returns clean JSON. Confirmed via browser DevTools.
//
// The endpoint is rate-limited (30 requests / 60s per IP). GitHub Actions
// runners share IP pools across many unrelated jobs, so a 429 can happen
// even on our very first request of the day if that pool's quota was
// already spent by someone else's traffic. We retry with backoff before
// giving up.
//
// Graceful fallback: if all attempts fail, or the response shape is
// unexpected, we do NOT overwrite thm-stats.json with blanks. We keep the
// previous committed values and just flag `stale: true` with an updated
// `lastAttempt` timestamp, so the site never shows broken UI — it just
// pauses auto-updating until the next successful run.

const fs = require("fs");
const path = require("path");

const USERNAME = "demonslave738";
const API_URL = `https://tryhackme.com/api/v2/public-profile?username=${USERNAME}`;
const OUTPUT_PATH = path.join(__dirname, "..", "thm-stats.json");
const MAX_ATTEMPTS = 4;

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  } catch {
    return { rank: null, points: null, roomsCompleted: null, badges: null, streak: null };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchProfile() {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(API_URL, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Referer": `https://tryhackme.com/p/${USERNAME}`
        }
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) || (attempt * 15);
        console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS}: rate limited (429), waiting ${retryAfter}s before retry...`);
        await sleep(retryAfter * 1000);
        lastErr = new Error("HTTP 429 Too Many Requests");
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      if (json.status !== "success" || !json.data) {
        throw new Error(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`);
      }

      return json.data;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        const backoff = attempt * 5;
        console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed (${err.message}), retrying in ${backoff}s...`);
        await sleep(backoff * 1000);
      }
    }
  }
  throw lastErr;
}

(async () => {
  const existing = loadExisting();
  const now = new Date().toISOString();

  try {
    const d = await fetchProfile();

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
    console.error("All attempts failed, kept last known-good values:", err);
  }
})();