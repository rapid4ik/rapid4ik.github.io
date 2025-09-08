// scripts/build-data.mjs
import fs from "fs";

const USERNAME = process.env.GH_USERNAME || "rapid4ik";
// Приоритет: пользовательский секрет GH_TOKEN, потом GH_PAT, потом встроенный GITHUB_TOKEN
const TOKEN = process.env.GH_TOKEN || process.env.GH_PAT || process.env.GITHUB_TOKEN || "";

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
    all.push(...pageItems);
    if (pageItems.length < 100) break;
  }
  all.sort((a,b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at));
  return all;
}

// Ограничение параллелизма
async function mapLimit(items, limit, worker){
  const ret = [];
  let i = 0; let active = 0;
  return new Promise((resolve, reject)=>{
    const next = ()=>{
      if(i===items.length && active===0) return resolve(ret);
      while(active<limit && i<items.length){
        const idx = i++; active++;
        Promise.resolve(worker(items[idx], idx)).then(v=>{ret[idx]=v; active--; next();}).catch(err=>reject(err));
      }
    };
    next();
  });
}

async function main() {
  const profile = await gh(`https://api.github.com/users/${USERNAME}`);
  const repos = await fetchAllRepos(USERNAME);

  // Языки по каждому репо + суммарно
  const langTotals = {};
  await mapLimit(repos, 6, async (r)=>{
    const langs = await gh(`https://api.github.com/repos/${r.full_name}/languages`);
    r._languages = langs;
    for (const [lang, bytes] of Object.entries(langs)) {
      langTotals[lang] = (langTotals[lang] || 0) + bytes;
    }
  });

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

  // Раздельные файлы
  fs.writeFileSync("data/profile.json", JSON.stringify(profile, null, 2));
  fs.writeFileSync("data/repos.json", JSON.stringify(slimRepos, null, 2));
  fs.writeFileSync("data/langTotals.json", JSON.stringify(langTotals, null, 2));

  // Сводный файл
  const summary = {
    updatedAt: new Date().toISOString(),
    profile,
    repos: slimRepos,
    langTotals
  };
  fs.writeFileSync("data/data.json", JSON.stringify(summary, null, 2));

  console.log(`✔ Сгенерированы data/profile.json, data/repos.json, data/langTotals.json и data/data.json
Профиль: ${profile.login}, репозиториев: ${slimRepos.length}, языков: ${Object.keys(langTotals).length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
