// scripts/build-data.mjs
import fs from "fs";
import path from "path";

const USERNAME = process.env.GH_USERNAME || "rapid4ik";
const TOKEN = process.env.GH_PAT || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

const headers = {
  "User-Agent": "rapid4ik-data-bot",
  "Accept": "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`GitHub API ${r.status}: ${txt}`);
  }
  return r.json();
}

async function fetchAllRepos(username) {
  const all = [];
  for (let page = 1; ; page++) {
    const pageItems = await gh(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=updated&direction=desc`);
    all.push(...pageItems.filter(r => !r.fork));
    if (pageItems.length < 100) break;
  }
  // сортировка: по звёздам, потом по обновлению
  all.sort((a,b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at));
  return all;
}

async function main() {
  const profile = await gh(`https://api.github.com/users/${USERNAME}`);
  const repos = await fetchAllRepos(USERNAME);

  // Языки по каждому репо + суммарно
  const langTotals = {};
  for (const r of repos) {
    const langs = await gh(`https://api.github.com/repos/${r.full_name}/languages`);
    r._languages = langs; // положим внутрь репо (удобно для сайта)
    for (const [lang, bytes] of Object.entries(langs)) {
      langTotals[lang] = (langTotals[lang] || 0) + bytes;
    }
  }

  // Ужимаем репо до нужных полей
  const slimRepos = repos.map(r => ({
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    updated_at: r.updated_at,
    pushed_at: r.pushed_at,
    languages: r._languages || {}
  }));

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/profile.json", JSON.stringify(profile, null, 2));
  fs.writeFileSync("data/repos.json", JSON.stringify(slimRepos, null, 2));
  fs.writeFileSync("data/langTotals.json", JSON.stringify(langTotals, null, 2));

  console.log(`✔ profile.json, repos.json, langTotals.json обновлены.
Профиль: ${profile.login}, репозиториев: ${slimRepos.length}, языков: ${Object.keys(langTotals).length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
