#!/usr/bin/env node
/* ============================================================
   MCQ LENGTH-TELL AUDIT
   For every MCQ across the gym decks, computes where the correct
   option ranks by character length (1 = longest). A fair deck has
   avg rank ~2.5 (4 options) and "correct == longest" near 25%.
   Usage:  node scripts/mcq-tell.mjs            (all decks)
           node scripts/mcq-tell.mjs ml llm     (named decks)
   Exit 0 if PASS (avg rank in [2.15, 2.85] AND longest ≤ 38%),
   else exit 1 — so it doubles as a CI gate.
   ============================================================ */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const which = process.argv.slice(2);
const decks = (which.length ? which : ["ml", "llm", "prompting", "agents", "promptkata"]);

globalThis.window = {};
for (const d of decks) {
  const src = readFileSync(resolve(ROOT, "gym/decks/" + d + ".js"), "utf8");
  // eslint-disable-next-line no-eval
  (0, eval)(src);
}
const D = globalThis.window.AIE_DECKS || {};

function optText(o) { return typeof o === "string" ? o : (o.html || o.text || o.label || ""); }

let allRanks = [], allLongest = 0, allN = 0, failDecks = [];
for (const id of decks) {
  const deck = D[id];
  if (!deck) continue;
  let ranks = [], longest = 0, n = 0;
  for (const it of deck.items) {
    if (it.type !== "mcq") continue;
    const opts = it.opts || it.options;
    if (!opts) continue;
    const lens = opts.map(o => optText(o).length);
    const ci = typeof it.correct === "number" ? it.correct : opts.findIndex(o => o && o.ok);
    if (ci < 0) continue;
    const sorted = [...lens].sort((a, b) => b - a);
    const rank = sorted.indexOf(lens[ci]) + 1;
    ranks.push(rank); n++; allN++; allRanks.push(rank);
    if (rank === 1) { longest++; allLongest++; }
  }
  if (!n) continue;
  const avg = ranks.reduce((a, b) => a + b, 0) / n;
  const pctLong = 100 * longest / n;
  const ok = avg >= 2.15 && avg <= 2.85 && pctLong <= 38;
  if (!ok) failDecks.push(id);
  console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(11)} items=${String(n).padStart(2)}  avgRank=${avg.toFixed(2)}  longest=${pctLong.toFixed(0)}%`);
}
const avgAll = allRanks.reduce((a, b) => a + b, 0) / (allN || 1);
const pctAll = 100 * allLongest / (allN || 1);
console.log("─".repeat(48));
console.log(`OVERALL  items=${allN}  avgRank=${avgAll.toFixed(2)}  longest=${pctAll.toFixed(0)}%  (target ~2.50 / ~25%)`);
const pass = failDecks.length === 0 && avgAll >= 2.15 && avgAll <= 2.85 && pctAll <= 35;
console.log(pass ? "GATE: PASS" : "GATE: FAIL — rebalance " + (failDecks.join(", ") || "overall"));
process.exit(pass ? 0 : 1);
