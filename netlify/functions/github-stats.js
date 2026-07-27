// netlify/functions/github-stats.js
//
// Returns { publicRepos, totalStars, topLanguages, lastUpdated } for AmanGour83.
// Uses GitHub's public REST API — no auth/token required for public data.
//
// Caching: results are kept in-memory per warm Lambda instance and only
// re-fetched from GitHub every CACHE_TTL_MS. Netlify Functions can cold-start
// at any time (which resets this cache), so this is a best-effort throttle,
// not a guarantee — but it's enough to stop a burst of page loads from
// burning through GitHub's unauthenticated rate limit (60 req/hr/IP).

const GITHUB_USER = "AmanGour83";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cache = { data: null, fetchedAt: 0 };

exports.handler = async function () {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=600", // let browsers/CDN cache too
    "Access-Control-Allow-Origin": "*"
  };

  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { statusCode: 200, headers, body: JSON.stringify(cache.data) };
  }

  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`,
      { headers: { Accept: "application/vnd.github+json", "User-Agent": GITHUB_USER } }
    );

    if (!reposRes.ok) throw new Error(`GitHub API responded ${reposRes.status}`);

    const repos = await reposRes.json();

    const publicRepos = repos.length;
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

    const langCounts = {};
    repos.forEach(r => {
      if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const latestCommitAt = repos
      .map(r => r.pushed_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    const data = { publicRepos, totalStars, topLanguages, latestCommitAt, lastUpdated: new Date().toISOString() };
    cache = { data, fetchedAt: now };

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    // If we have any stale cached data, prefer serving that over an error.
    if (cache.data) {
      return { statusCode: 200, headers, body: JSON.stringify({ ...cache.data, stale: true }) };
    }
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "Unable to fetch GitHub stats", detail: String(err.message || err) })
    };
  }
};
