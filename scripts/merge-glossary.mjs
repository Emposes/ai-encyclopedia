#!/usr/bin/env node
/* Merge glossary terms from docs/waves/meta/*.json sidecars into
   assets/js/glossary.js DEFS, skipping case-insensitive duplicates.
   Idempotent: re-running adds only genuinely new terms. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GLOSS = join(ROOT, "assets/js/glossary.js");
const META = join(ROOT, "docs/waves/meta");

let src = readFileSync(GLOSS, "utf8");
const start = src.indexOf("var DEFS = {");
const end = src.indexOf("\n  };", start); // closing brace of DEFS
if (start < 0 || end < 0) { console.error("DEFS bounds not found"); process.exit(1); }

const existing = new Set(
  [...src.slice(start, end).matchAll(/^\s*"([^"]+)"\s*:/gm)].map((m) => m[1].toLowerCase())
);

const seen = new Set();
const additions = [];
for (const f of readdirSync(META).filter((f) => f.endsWith(".json"))) {
  let data;
  try { data = JSON.parse(readFileSync(join(META, f), "utf8")); } catch { continue; }
  for (const g of data.glossary || []) {
    const term = (g.term || "").trim();
    const def = (g.def || "").replace(/\s+/g, " ").trim();
    if (!term || !def) continue;
    const key = term.toLowerCase();
    if (existing.has(key) || seen.has(key)) continue;
    seen.add(key);
    additions.push([term, def]);
  }
}

if (!additions.length) { console.log("[merge-glossary] no new terms"); process.exit(0); }
additions.sort((a, b) => a[0].localeCompare(b[0]));
const block = ",\n    /* ---- V2 expansion terms ---- */\n" +
  additions.map(([t, d]) => "    " + JSON.stringify(t) + ": " + JSON.stringify(d)).join(",\n");
src = src.slice(0, end) + block + src.slice(end);
writeFileSync(GLOSS, src);
console.log("[merge-glossary] added", additions.length, "terms; DEFS now ~" + (existing.size + additions.length));
