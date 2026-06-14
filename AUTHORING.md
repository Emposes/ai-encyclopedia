# AI ENCYCLOPEDIA — CHAPTER AUTHORING SPEC v2

You are writing ONE chapter page for the AI Encyclopedia (formerly the LLM Field Manual).
Read this entire file, then skim the reference chapter `chapters/06-finetuning.html`
(structure) and `chapters/03-attention.html` (instrument richness) before writing.

## Non-negotiable rules

1. **One self-contained HTML file.** All chapter-specific widget JS goes INLINE in a
   single `<script>` IIFE at the bottom of YOUR file. Never edit shared files
   (`assets/css/manual.css`, `assets/js/shared.js`, `assets/js/glossary.js`,
   `assets/js/interactives.js`, other chapters).
2. **Palette is locked.** Only these colors (and rgba tints of them):
   `#000000` bg · `#1e2124` panel · `#2f3234` hairline · `#565656` border ·
   `#e5e5e5` text · `#ffffff` bright · `#9b9b9b` secondary · `#636363` muted ·
   `#a6f2cc` mint accent · `#2b5945` deep green · `#4e8af7` blue · `#ff4136` danger.
3. **Math**: KaTeX. Display: `$$ ... $$` inside `.eq` blocks. Inline: `\( ... \)`.
   Escape `<` as `&lt;` inside math. Every display equation sits in the `.eq` pattern
   (see below) with an `eq-tag`.
4. **No lorem, no placeholders, no "TODO".** Every section fully written, technically
   correct, current as of 2026. When a claim is contested, say so honestly.
5. **≥ 2 interactive instruments per chapter** (3 is better). EVERY chapter in EVERY
   volume also needs **≥ 2 runnable Python cells** (`.pycell`, spec below) — toy
   NumPy implementations of the chapter's core mechanism. If a concept truly cannot
   run in a browser, run its arithmetic (cost models, estimators, simulators) instead.
   Pages with pycells must include pyrunner.js (after shared.js).
6. **Glossary**: do NOT edit glossary.js. Instead return 3–8 new term definitions in
   your structured report (term + 1–2 sentence definition, matching existing tone).
7. Reduced-motion users: never gate content behind animation. Widgets must render a
   sensible initial state without any interaction.
8. **Background-tab safety**: use `setTimeout`/`setInterval` for multi-step
   animations, NOT requestAnimationFrame chains.

## Page skeleton (copy exactly, fill the UPPERCASE slots)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TITLE — AI Encyclopedia</title>
<meta name="description" content="ONE-SENTENCE DESCRIPTION" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
<link rel="stylesheet" href="../assets/css/manual.css" />
</head>
<body>

<header class="topbar">
  <a class="wordmark" href="../index.html"><span class="tick"></span>AI // ENCYCLOPEDIA</a>
  <span class="crumb">/ VOLUME-LABEL / NN / SHORT-TITLE</span>
  <span class="spacer"></span>
  <a class="bar-link" href="../index.html#toc">INDEX</a>
  <a class="bar-link primary" href="NEXT-FILE">NEXT: NEXT-SHORT →</a>
</header>
<div class="progress-rail"><div class="progress-fill"></div></div>

<div class="shell">
  <section class="chapter-hero">
    <div class="ch-index">VOLUME-LONG · CHAPTER NN / TOTAL</div>
    <h1>TITLE</h1>
    <p class="lede">2–4 sentence lede with ONE <strong>bold idea</strong>.</p>
    <div class="ch-meta">
      <span>LEVEL<b>INTRO|CORE|ADVANCED</b></span>
      <span>READING TIME<b>≈ NN MIN</b></span>
      <span>BUILDS ON<b>…</b></span>
      <span>INSTRUMENTS<b>NAME · NAME</b></span>
    </div>
  </section>

  <div class="chapter-grid">
    <nav class="side-nav">
      <div class="side-label">IN THIS CHAPTER</div>
      <a href="#s1"><span class="n">N.1</span>Section name</a>
      <!-- one per section, ids s1..sK -->
    </nav>
    <main>
      <section class="section" id="s1">
        <div class="sec-head"><span class="sec-num">N.1</span><h2>Heading</h2></div>
        <p>…prose…</p>
      </section>
      <!-- … -->
      <nav class="pager">
        <a href="PREV-FILE"><div class="p-dir">← PREVIOUS</div><div class="p-title"><span class="p-num">NN</span> PREV TITLE</div></a>
        <a class="next" href="NEXT-FILE"><div class="p-dir">NEXT CHAPTER</div><div class="p-title"><span class="p-num">NN</span> NEXT TITLE</div></a>
      </nav>
    </main>
  </div>
</div>

<footer class="footer"><div class="shell">
  <div class="f-col">AI // ENCYCLOPEDIA — VOLUME-LABEL · CH NN</div>
  <div class="f-col"><a href="../index.html#toc">FULL CONTENTS ↗</a></div>
</div></footer>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="if(window.__manualMathReady)window.__manualMathReady()"></script>
<script src="../assets/js/videos.js"></script>
<script src="../assets/js/glossary.js"></script>
<script src="../assets/js/shared.js"></script>
<script src="../assets/js/pyrunner.js"></script>
<script src="../assets/js/exercises.js"></script>
<script>
/* chapter instruments — single IIFE, no globals */
(function () {
  "use strict";
  var FM = window.FM; // helpers: FM.setupCanvas, FM.softmax, FM.mulberry32, FM.siFormat, FM.C (colors)
  // … widgets, each guarded by element existence …
})();
</script>
<script src="../assets/js/lesson.js"></script>
</body>
</html>
```

**Script order is exact** (the lesson player reads videos.js and must load last): `videos.js → glossary.js → shared.js → pyrunner.js → exercises.js →` your inline IIFE `→ lesson.js`. Write plain paths (no `?v=`); the build adds cache-bust hashes.

## Component patterns (use verbatim)

**Equation block**
```html
<div class="eq"><span class="eq-tag">EQ X.N — NAME</span>
$$ … $$
<div class="eq-note">What each symbol means; why it matters. <b>Bold</b> the key insight.</div>
</div>
```
EQ prefixes: Volume I → `EQ M{ch}.{n}` · Volume III → `EQ P{ch}.{n}` · Volume IV → `EQ A{ch}.{n}`.
Cross-reference Volume II as e.g. “Vol II · EQ 4.1”.

**Instrument (widget)**
```html
<div class="widget" id="UNIQUE-ID" data-reveal>
  <div class="w-head"><span class="w-dot"></span><span class="w-title">INSTRUMENT X.N — NAME</span><span class="w-sub">SHORT TECH NOTE</span></div>
  <div class="w-body"> … controls (.ctl-row/.ctl/label+output+input), canvas.w-canvas, .readout-strip … </div>
  <div class="w-note">How to play with it + the lesson it teaches.</div>
</div>
```
Instrument prefixes: Vol I → `M{ch}.{n}` · Vol III → `P{ch}.{n}` · Vol IV → `A{ch}.{n}`.
All element ids on the page MUST be unique and prefixed with the chapter slug
(e.g. `gd-lr`, `gd-canvas` for the gradient-descent chapter).

**Runnable Python cell (Volume I)** — pyrunner.js enhances this automatically:
```html
<div class="pycell" data-py>
  <div class="py-head"><span>PYTHON · RUNNABLE IN-BROWSER</span><span class="py-status"></span></div>
  <pre class="py-src" contenteditable="true" spellcheck="false">import numpy as np
# fully working numpy code, < 30 lines, prints results
</pre>
  <div class="py-bar"><button class="w-btn py-run">RUN ▶</button><span class="py-note">edits are live — break it on purpose</span></div>
  <pre class="py-out" hidden></pre>
  <canvas class="py-plot" hidden height="260"></canvas>
</div>
```
Inside Python you may call `plot_xy(xs, ys)` (line) and `plot_scatter(xs, ys)` /
`plot_scatter(xs, ys, labels)` (points, labels = ints for color groups). Lists or
np arrays both fine. numpy is available; do NOT import matplotlib/sklearn/pandas.
Code must run in < 3 s and print something meaningful even unedited.

**Other available patterns**: `.figure` (inline SVG diagrams with `data-draw` on paths
for stroke animation, `data-pop` on groups; classes dg-box/dg-box-accent/dg-line/
dg-label…), `.callout` (`<span class="co-icon">LABEL</span><p>…</p>`, add `.warn`),
`table.data` (`td.m` mono, `td.hl` mint), `.spec-grid/.spec-cell`, `code`, `pre`
(`.k` keyword `.v` value `.c` comment spans), `.tok-chip tok-c0..c3`, `[data-reveal]`,
`[data-reveal-stagger]`, `[data-count-to]`.

## FM helper API (from shared.js — available to your inline script)

- `FM.setupCanvas(canvas, cssHeight)` → `{ctx, w, h}` (DPR-corrected; call on every render; re-render on window resize)
- `FM.softmax(arr, temperature)` → array
- `FM.mulberry32(seed)` → deterministic RNG function
- `FM.siFormat(x, digits)` → "1.5B", "42K"…
- `FM.C` = `{MINT:"#a6f2cc", DEEP:"#2b5945", BLUE:"#4e8af7", RED:"#ff4136", HAIR:"#2f3234", MUT:"#636363", SEC:"#9b9b9b", BRIGHT:"#ffffff", MONO:"10px ui-monospace, SF Mono, Menlo, monospace"}`

## Voice & pedagogy

- Manual voice: precise, confident, plain. Reference-grade, not marketing. Intuition first,
  then the math, then the engineering consequence.
- **Avoid AI-writing tells**: don't lean on em-dashes (use periods/colons), avoid the
  formulaic lede shape "X is the Y that Z", and skip chipper microcopy. No decorative
  glyphs (▸ › ✦ ◈ ✎ ✓ etc.) in UI or headings — keep it clean and typographic.
- Every chapter ends with a `.callout` whose icon is `NEXT`, bridging to the next chapter.
- Honesty beats neatness: include the caveats experts would raise.
- Use the existing Vol II chapters as the quality bar — match or exceed.
- Difficulty: INTRO = no math beyond algebra · CORE = comfortable with the manual's
  notation · ADVANCED = research-adjacent.

## V2 additions (REQUIRED for all new chapters)

**Track + level tags.** Put both on the `<body>` so the build can index the page:
`<body data-track="TRACK" data-level="intro|core|advanced">`. TRACK is the directory
slug: `stats data ml mlops dl rl game-theory timeseries quant frameworks chapters
prompting agents`. The hero badge text (INTRO/CORE/ADVANCED) must match `data-level`.

**Per-track EQ / instrument prefixes.** Vol I `M` · Vol III `P` · Vol IV `A` · Vol II plain.
New tracks: stats `S` · data `D` · mlops `V` · dl `N` · rl `R` · game-theory `G` ·
timeseries `T` · quant `Q` · frameworks `F`. So a quant ch-3 equation is `EQ Q3.1`,
an instrument `INSTRUMENT Q3.1 — NAME`, ids prefixed with the chapter slug.

**References section (REQUIRED, last section before the pager).** Every chapter cites
its real primary sources as clickable links. Use the shipped `.ref-list` component
(no inline styles needed):
```html
<section class="section" id="sN"><div class="sec-head"><span class="sec-num">N.R</span><h2>References</h2></div>
<ol class="ref-list">
  <li><a href="https://arxiv.org/abs/XXXX.XXXXX" target="_blank" rel="noopener">Author, A. &amp; Author, B. (YEAR). <span class="ref-venue">Title of the paper</span>.</a> <span class="ref-meta">venue/note</span></li>
</ol></section>
```
Prefer arXiv `abs/` links, DOIs, or official docs. Cite the canonical source for each
major result in the chapter (≥3 where the field has them; textbooks are fine for
classical topics). Add the matching `#sN` entry to the sidebar nav. The build
aggregates all `.ref-list` items into the global Bibliography — so links must be real.

**Exercises (REQUIRED — ≥2 per chapter, "write-the-value" style).** Place inside the
relevant section(s). exercises.js enhances them into graded inputs; the lesson player
turns them into the "Try it" step. Contract:
```html
<div class="exercise" data-answer="3" data-tol="0.001" data-unit="" data-hint="apply the update rule">
  <div class="ex-q">A question whose answer is a single number; inline math with \( ... \).</div>
  <div class="ex-reveal-src">The worked solution, ending in the <b>numeric answer</b>.</div>
</div>
```
`data-answer` numeric (graded with relative tolerance `data-tol`, default 0.02) or a
short string; `data-unit` optional; `data-hint` one line. Make exercises test the
chapter's core computation (e.g. "compute this GARCH one-step variance", "this PSI
bucket's contribution"). Do NOT add the input/buttons yourself — exercises.js does.

## Self-check before you finish (do all of these)

1. Every sidebar link `#sN` matches an existing section id; numbering sequential.
2. Pager + topbar NEXT links point to the exact files given in your brief.
3. All ids unique & slug-prefixed; widgets guarded (`if (!root) return;`).
4. KaTeX: balanced delimiters; `&lt;` for < inside math; no raw `&` (use `\&` or prose).
5. Inline script wrapped in IIFE with `"use strict"`; uses FM helpers; no console.log.
6. Animations use setTimeout/setInterval, not rAF chains.
7. Mentally execute every widget's math once with default slider values.
8. File parses: balanced tags, single `<main>`, scripts block identical to skeleton
   (plus pyrunner.js only if pycells used).

## After authoring: render the concept videos (REQUIRED)

A chapter is not "done" until its concept videos exist — every new content
section needs a narrated Watch-step video. Once the new pages are written and
`node scripts/build.mjs` passes, run the concept-video pipeline:

1. Script-gen fleet: run `scripts/gen-video-scripts.workflow.mjs` with
   `args = { root, chapters: ["dir/name", …] }` → per-section beats in `docs/video-scripts/*.json`.
2. In `remotion-demo/`: `node scripts/merge-video-scripts.mjs` (→ registry.json).
3. Narrate: `node scripts/gen-narration-kokoro.mjs build-jobs` →
   `.venv-kokoro/bin/python scripts/kokoro-narrate.py out/narration-jobs.json > out/narration-out.jsonl`
   (voice `af_heart`) → `node scripts/gen-narration-kokoro.mjs finalize`.
4. Render + wire: `node scripts/render-all.mjs "dir/name,…"` (Remotion, CRF 28) →
   `node scripts/sync-videos.mjs --all` (the `--all` matters — the default log-gate misses a fresh batch) → it regenerates `videos.js`.
5. Back in the site repo: `node scripts/build.mjs`, then deploy.

The lesson player degrades gracefully if a video is missing, but new chapters ship WITH videos.
