#!/usr/bin/env node
/* ============================================================
   AI ENCYCLOPEDIA — static build pass
   Generates: search-index.json, llms.txt, llms-full.txt,
   sitemap.xml, robots.txt. Also link-checks internal hrefs.
   Zero dependencies; regex parsing is safe on our own markup.
   Run from the llm-manual directory:  node scripts/build.mjs
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://llm-manual.vercel.app";

// Track list drives search, llms.txt, cache-busting, link-checking, content.json.
// `part` groups tracks for the hub/onboarding; existing four keep their VOL tags.
const VOLUMES = [
  { dir: "stats",       tag: "STATS",   name: "Mathematics & Statistics",          part: "Foundations" },
  { dir: "data",        tag: "DATA",    name: "Data & Feature Engineering",         part: "Foundations" },
  { dir: "ml",          tag: "VOL I",   name: "Machine Learning",                   part: "Classical ML" },
  { dir: "mlops",       tag: "MLOPS",   name: "Model Validation & Risk / MLOps",    part: "Classical ML" },
  { dir: "dl",          tag: "DL",      name: "Deep Learning",                      part: "Deep Learning & RL" },
  { dir: "rl",          tag: "RL",      name: "Reinforcement Learning",             part: "Deep Learning & RL" },
  { dir: "game-theory", tag: "GAME",    name: "Game Theory",                        part: "Deep Learning & RL" },
  { dir: "timeseries",  tag: "TIME",    name: "Time Series & Econometrics",         part: "Quant" },
  { dir: "quant",       tag: "QUANT",   name: "Quantitative Finance",               part: "Quant" },
  { dir: "chapters",    tag: "VOL II",  name: "The LLM Field Manual",               part: "AI Systems" },
  { dir: "prompting",   tag: "VOL III", name: "Prompting",                          part: "AI Systems" },
  { dir: "agents",      tag: "VOL IV",  name: "Agent Engineering",                  part: "AI Systems" },
  { dir: "frameworks",  tag: "FRAME",   name: "Frameworks",                         part: "AI Systems" },
  { dir: "multimodal",  tag: "MM",      name: "Multimodal & World Models",          part: "AI Systems" },
  { dir: "openmodels",  tag: "OPEN",    name: "Open Models & Practice",             part: "AI Systems" },
];

function pagesIn(dir) {
  const p = join(ROOT, dir);
  if (!existsSync(p)) return [];
  return readdirSync(p).filter(f => f.endsWith(".html")).sort().map(f => join(dir, f));
}

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;|&shy;/g, " ").replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ").replace(/ ([;:,.)])/g, "$1").trim();
}

function extract(rel) {
  const html = readFileSync(join(ROOT, rel), "utf8");
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1]?.split("—")[0].trim() || rel;
  const lede = strip((html.match(/<p class="lede">([\s\S]*?)<\/p>/) || ["", ""])[1]).slice(0, 220);
  const sections = [];
  const re = /<section class="section" id="(s\d+)">[\s\S]*?<h2>([\s\S]*?)<\/h2>([\s\S]*?)(?=<section class="section"|<nav class="pager")/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    sections.push({ id: m[1], h: strip(m[2]), body: strip(m[3]) });
  }
  return { title, lede, sections, text: strip(html) };
}

/* ---------- gather ---------- */
const searchIndex = [];
const fullParts = [];
const sitemapUrls = ["/"];

searchIndex.push({ t: "The AI Encyclopedia — Index", s: "All volumes, the Gym, notation", u: "/index.html", v: "HUB", b: "Four volumes from first principles to frontier, plus the Gym." });
if (existsSync(join(ROOT, "gym/index.html"))) {
  searchIndex.push({ t: "The Gym", s: "Drills, katas, calculators", u: "/gym/index.html", v: "GYM", b: "Concept drills, numeric problems and Python code katas for every volume, graded in your browser." });
  sitemapUrls.push("/gym/index.html");
}

for (const vol of VOLUMES) {
  const pages = pagesIn(vol.dir);
  fullParts.push("\n\n" + "=".repeat(72) + "\n" + vol.name.toUpperCase() + "\n" + "=".repeat(72));
  for (const rel of pages) {
    const url = "/" + rel;
    sitemapUrls.push(url);
    const { title, lede, sections, text } = extract(rel);
    searchIndex.push({ t: title, s: lede.slice(0, 110), u: url, v: vol.tag, b: lede });
    for (const sec of sections) {
      searchIndex.push({ t: title, s: sec.h, u: url + "#" + sec.id, v: vol.tag, b: sec.body.slice(0, 150) });
    }
    fullParts.push("\n\n## " + vol.tag + " · " + title + "  (" + SITE + url + ")\n\n" + text);
  }
}

/* ---------- write artifacts ---------- */
writeFileSync(join(ROOT, "search-index.json"), JSON.stringify(searchIndex));

/* ---------- content.json manifest (track × level) + bibliography ---------- */
function getRefs(html) {
  const out = [];
  const blocks = html.match(/<ol class="ref-list">[\s\S]*?<\/ol>/g) || [];
  const refSec = html.match(/<h2>\s*References\s*<\/h2>([\s\S]*?)<\/section>/i); // pilot fallback (inline ol)
  if (refSec) blocks.push(refSec[1]);
  const seen = new Set();
  for (const block of blocks) {
    for (const li of block.match(/<li>[\s\S]*?<\/li>/g) || []) {
      const href = (li.match(/href="(https?:\/\/[^"]+)"/) || [])[1];
      if (!href || seen.has(href)) continue;
      seen.add(href);
      out.push({ cite: strip(li), url: href });
    }
  }
  return out;
}
const manifest = [];
const biblio = new Map(); // url -> { cite, tracks:Set }
for (const vol of VOLUMES) {
  for (const rel of pagesIn(vol.dir)) {
    const html = readFileSync(join(ROOT, rel), "utf8");
    const track = (html.match(/<body[^>]*\bdata-track="([^"]+)"/) || [])[1] || vol.dir;
    const level = ((html.match(/<body[^>]*\bdata-level="([^"]+)"/) || [])[1]
      || (html.match(/LEVEL<b>([^<]+)<\/b>/) || [])[1] || "").toLowerCase();
    const { title, lede, sections } = extract(rel);
    manifest.push({ file: "/" + rel, dir: vol.dir, track, level, part: vol.part, tag: vol.tag,
      title, desc: lede.slice(0, 160), sections: sections.map(s => ({ id: s.id, h: s.h })) });
    for (const r of getRefs(html)) {
      if (!biblio.has(r.url)) biblio.set(r.url, { cite: r.cite, tracks: new Set() });
      biblio.get(r.url).tracks.add(vol.tag);
    }
  }
}
writeFileSync(join(ROOT, "content.json"), JSON.stringify(manifest));

const refsSorted = [...biblio.entries()].sort((a, b) => a[1].cite.localeCompare(b[1].cite));
const biblioHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bibliography — AI Encyclopedia</title><meta name="description" content="Every primary source cited across the AI Encyclopedia." />
<link rel="stylesheet" href="assets/css/manual.css" /></head>
<body data-track="bibliography" data-level="intro">
<header class="topbar"><a class="wordmark" href="index.html"><span class="tick"></span>AI // ENCYCLOPEDIA</a>
<span class="crumb">/ REFERENCES / BIBLIOGRAPHY</span><span class="spacer"></span>
<a class="bar-link" href="index.html#toc">INDEX</a></header>
<div class="progress-rail"><div class="progress-fill"></div></div>
<div class="shell"><section class="chapter-hero"><div class="ch-index">REFERENCES</div>
<h1>Bibliography</h1><p class="lede">Every primary source cited across the encyclopedia — <strong>${refsSorted.length} references</strong>, linked to where you can read them.</p></section>
<div class="chapter-grid"><main><section class="section" id="s1"><div class="sec-head"><span class="sec-num">§</span><h2>All sources</h2></div>
<ol class="ref-list">
${refsSorted.map(([url, v]) => `  <li><a href="${url}" target="_blank" rel="noopener">${v.cite.replace(/\s+/g, " ").trim()}</a> <span class="ref-meta">${[...v.tracks].join(" · ")}</span></li>`).join("\n")}
</ol></section></main></div></div>
<footer class="footer"><div class="shell"><div class="f-col">AI // ENCYCLOPEDIA — BIBLIOGRAPHY</div><div class="f-col"><a href="index.html#toc">FULL CONTENTS ↗</a></div></div></footer>
<script src="assets/js/shared.js"></script></body></html>`;
writeFileSync(join(ROOT, "bibliography.html"), biblioHtml);
console.log("content.json entries:", manifest.length, "| bibliography refs:", refsSorted.length);

const llmsTxt = `# The AI Encyclopedia

> A free, open, interactive encyclopedia of AI: machine learning from first
> principles, the complete LLM field manual, prompting, and agent engineering —
> with runnable Python and 70+ live instruments. ${SITE}

## Volumes

${VOLUMES.map(v => pagesIn(v.dir).map(rel => {
  const { title, lede } = extract(rel);
  return `- [${v.tag} · ${title}](${SITE}/${rel}): ${lede.slice(0, 140)}`;
}).join("\n")).join("\n")}

## Practice

- [The Gym](${SITE}/gym/index.html): drills, numeric problems and Python katas, graded client-side.

## Full content

- [llms-full.txt](${SITE}/llms-full.txt): the complete text of every chapter in one file — load it as context.
`;
writeFileSync(join(ROOT, "llms.txt"), llmsTxt);
writeFileSync(join(ROOT, "llms-full.txt"),
  "THE AI ENCYCLOPEDIA — FULL TEXT EXPORT\n" + SITE + "\nGenerated for LLM consumption. Interactive instruments and Python cells are not representable in text — visit the site to use them.\n" + fullParts.join(""));

writeFileSync(join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapUrls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join("\n") + "\n</urlset>");

writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

/* ---------- asset cache-busting: content-hash every local asset ref ---------- */
import { createHash } from "node:crypto";
const hashCache = {};
function hashOf(relAsset) {
  if (hashCache[relAsset] !== undefined) return hashCache[relAsset];
  const p = join(ROOT, relAsset);
  hashCache[relAsset] = existsSync(p)
    ? createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8)
    : null;
  return hashCache[relAsset];
}
const ASSET_RE = /(href|src)="((?:\.\.\/|\/)?(assets\/(?:css|js)\/[\w.-]+\.(?:css|js)|gym\/(?:gym|decks\/[\w-]+)\.js))(\?v=[^"]*)?"/g;
const htmlFiles = ["index.html", "404.html", "studio.html", "bibliography.html", ...VOLUMES.flatMap(v => pagesIn(v.dir)), ...(existsSync(join(ROOT, "gym/index.html")) ? ["gym/index.html"] : [])].filter(f => existsSync(join(ROOT, f)));
let stamped = 0;
for (const rel of htmlFiles) {
  if (!existsSync(join(ROOT, rel))) continue;
  const before = readFileSync(join(ROOT, rel), "utf8");
  const after = before.replace(ASSET_RE, (m, attr, url, assetPath) => {
    const h = hashOf(assetPath);
    return h ? `${attr}="${url}?v=${h}"` : m;
  });
  if (after !== before) { writeFileSync(join(ROOT, rel), after); stamped++; }
}
console.log("cache-bust: rewrote asset versions in", stamped, "pages");

/* ---------- MCQ length-tell regression guard (warning-only) ---------- */
try {
  const { execSync } = await import("node:child_process");
  const out = execSync("node " + JSON.stringify(join(ROOT, "scripts/mcq-tell.mjs")), { cwd: ROOT, encoding: "utf8" });
  const overall = out.split("\n").find(l => l.startsWith("OVERALL")) || "";
  console.log("mcq-tell:", overall.trim() || "ran");
} catch (e) {
  const out = (e.stdout || "").toString();
  const overall = out.split("\n").find(l => l.startsWith("OVERALL")) || "";
  console.log("⚠ MCQ LENGTH-TELL REGRESSION —", overall.trim() || "gate failed; run node scripts/mcq-tell.mjs");
}

/* ---------- link check ---------- */
const broken = [];
const allPages = ["index.html", "studio.html", ...VOLUMES.flatMap(v => pagesIn(v.dir)), ...(existsSync(join(ROOT, "gym/index.html")) ? ["gym/index.html"] : [])].filter(f => existsSync(join(ROOT, f)));
for (const rel of allPages) {
  const html = readFileSync(join(ROOT, rel), "utf8");
  const hrefs = [...html.matchAll(/href="([^"#?]+?\.(?:html|txt|json|css))(?:[?#][^"]*)?"/g)].map(x => x[1]);
  for (const href of hrefs) {
    if (/^https?:|^mailto:/.test(href)) continue;
    const target = href.startsWith("/") ? join(ROOT, href) : join(ROOT, dirname(rel), href);
    if (!existsSync(target)) broken.push(rel + " -> " + href);
  }
}

console.log("search-index entries:", searchIndex.length);
console.log("pages:", allPages.length, "| sitemap urls:", sitemapUrls.length);
console.log(broken.length ? "BROKEN LINKS:\n  " + broken.join("\n  ") : "links: all internal links resolve");
