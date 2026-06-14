#!/usr/bin/env node
/* Generate the track × level grouped Table of Contents from content.json.
   If index.html contains <!--AUTO-TOC:START--> ... <!--AUTO-TOC:END--> markers,
   inject between them; otherwise write docs/_toc.generated.html for preview.
   Run after the content build (content.json must exist). */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "content.json"), "utf8"));

// Part → ordered tracks; track → display name + short code for the t-num.
const PARTS = [
  ["Foundations", [["stats", "Mathematics & Statistics", "ST"], ["data", "Data & Feature Engineering", "DT"]]],
  ["Classical Machine Learning", [["ml", "Machine Learning", "ML"], ["mlops", "Model Validation & Risk · MLOps", "MV"]]],
  ["Deep Learning, RL & Games", [["dl", "Deep Learning", "DL"], ["rl", "Reinforcement Learning", "RL"], ["game-theory", "Game Theory", "GT"]]],
  ["Quantitative Finance", [["timeseries", "Time Series & Econometrics", "TS"], ["quant", "Quantitative Finance", "QF"]]],
  ["AI Systems", [["chapters", "The LLM Field Manual", "LLM"], ["prompting", "Prompting", "PR"], ["agents", "Agent Engineering", "AG"], ["multimodal", "Multimodal & World Models", "MM"], ["openmodels", "Open Models & Practice", "OM"], ["frameworks", "Frameworks", "FW"]]],
];

const byDir = {};
for (const p of manifest) (byDir[p.dir] ||= []).push(p);
for (const k in byDir) byDir[k].sort((a, b) => a.file.localeCompare(b.file));

const esc = (s) => (s || "").replace(/&(?!amp;|lt;|gt;|#)/g, "&amp;");
const numOf = (file) => (file.match(/\/(\d{2})-/) || [])[1] || (file.includes("capstone") ? "⌘" : "");
const lvlBadge = (lv) => (lv || "").toUpperCase();

let html = "";
for (const [partName, tracks] of PARTS) {
  const present = tracks.filter(([dir]) => byDir[dir] && byDir[dir].length);
  if (!present.length) continue;
  html += `\n      <h2 class="part-label">${esc(partName)}</h2>\n`;
  for (const [dir, name, code] of present) {
    const chs = byDir[dir];
    const levels = [...new Set(chs.map((c) => lvlBadge(c.level)).filter(Boolean))];
    html += `      <div class="vol-block" data-reveal>\n`;
    html += `        <div class="vol-head"><span class="v-tag">${code}</span><h3>${esc(name)}</h3><span class="v-sub">${chs.length} CHAPTER${chs.length === 1 ? "" : "S"}${levels.length ? " · " + levels.join(" → ") : ""}</span><span class="v-prog"></span></div>\n`;
    html += `        <nav class="toc-list">\n`;
    for (const c of chs) {
      const n = numOf(c.file);
      const tags = lvlBadge(c.level);
      html += `          <a class="toc-item" href="${c.file.replace(/^\//, "")}"><span class="t-num">${code} ${n}</span><span class="t-title">${esc(c.title)}</span><span class="t-desc">${esc(c.desc)}<span class="tags">${tags}</span></span></a>\n`;
    }
    html += `        </nav>\n      </div>\n`;
  }
}

const idxPath = join(ROOT, "index.html");
const idx = existsSync(idxPath) ? readFileSync(idxPath, "utf8") : "";
const START = "<!--AUTO-TOC:START-->", END = "<!--AUTO-TOC:END-->";
if (idx.includes(START) && idx.includes(END)) {
  const out = idx.slice(0, idx.indexOf(START) + START.length) + "\n" + html + "      " + idx.slice(idx.indexOf(END));
  writeFileSync(idxPath, out);
  console.log("[gen-hub] injected TOC into index.html (" + manifest.length + " chapters)");
} else {
  writeFileSync(join(ROOT, "docs/_toc.generated.html"), html);
  console.log("[gen-hub] wrote docs/_toc.generated.html (no markers in index.html yet) — " + manifest.length + " chapters");
}
