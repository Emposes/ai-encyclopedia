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

const VOLUMES = [
  { dir: "ml", tag: "VOL I", name: "Volume I — Foundations of Machine Learning" },
  { dir: "chapters", tag: "VOL II", name: "Volume II — The LLM Field Manual" },
  { dir: "prompting", tag: "VOL III", name: "Volume III — Prompting" },
  { dir: "agents", tag: "VOL IV", name: "Volume IV — Agent Engineering" },
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
    .replace(/\s+/g, " ").trim();
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

/* ---------- link check ---------- */
const broken = [];
const allPages = ["index.html", ...VOLUMES.flatMap(v => pagesIn(v.dir)), ...(existsSync(join(ROOT, "gym/index.html")) ? ["gym/index.html"] : [])];
for (const rel of allPages) {
  const html = readFileSync(join(ROOT, rel), "utf8");
  const hrefs = [...html.matchAll(/href="([^"#]+?\.(?:html|txt|json|css))(?:#[^"]*)?"/g)].map(x => x[1]);
  for (const href of hrefs) {
    if (/^https?:|^mailto:/.test(href)) continue;
    const target = href.startsWith("/") ? join(ROOT, href) : join(ROOT, dirname(rel), href);
    if (!existsSync(target)) broken.push(rel + " -> " + href);
  }
}

console.log("search-index entries:", searchIndex.length);
console.log("pages:", allPages.length, "| sitemap urls:", sitemapUrls.length);
console.log(broken.length ? "BROKEN LINKS:\n  " + broken.join("\n  ") : "links: all internal links resolve");
