# The AI Encyclopedia

**AI, from first principles to frontier — free, open source, and interactive.**

Live: **https://llm-manual.vercel.app**

Four volumes. 32 chapters. 150+ equations rendered with KaTeX. 70+ live instruments —
every major concept is something you can *play with*, not just read. Real Python
(NumPy via Pyodide/WASM) runs in the page. A hover glossary so you never lose the
thread. A Gym with drills, numeric problems, and code katas graded entirely in your
browser. No accounts, no tracking, no backend.

## The volumes

| Volume | What it covers |
|---|---|
| **I — Foundations of ML** | Learning from data → linear/logistic regression → trees & k-NN → clustering & PCA → bias/variance → MLPs → backpropagation. Runnable NumPy in every chapter. |
| **II — The LLM Field Manual** | Tokens → transformer → attention (MHA/GQA/MLA/Flash) → pre-training & scaling laws → RLHF/DPO/GRPO → LoRA/QLoRA → distillation & quantization → inference & serving → MoE/long context → diffusion → an end-to-end capstone. |
| **III — Prompting** | How prompts condition the distribution → the Role/Task/Context/Format/Constraints scaffold → few-shot → reasoning controls → structured output → self-critique, red teams & councils → evals + a bring-your-own-key live lab. |
| **IV — Agent Engineering** | The agentic loop → context engineering → tool design & MCP → harness engineering → loop engineering & multi-agent patterns → evals, observability & cost. |
| **The Gym** | LeetCode-style practice for all of it: MCQ drills, numeric problems, Python katas with hidden tests — graded client-side, with shareable result cards. |

## Design

A locked dark design system (Palantir-style tokens × Apple restraint): pure black,
mint `#a6f2cc`, hairline rules, mono labels, Alliance/SF type, GSAP scroll
choreography, Three.js cover. Zero build step — every page is hand-tuned static
HTML on a shared engine (`assets/`).

## For LLMs

The entire encyclopedia ships as [`llms.txt`](https://llm-manual.vercel.app/llms.txt)
and a single-file [`llms-full.txt`](https://llm-manual.vercel.app/llms-full.txt) —
drop it into your model's context and ask questions.

## Build your own manual

This site runs on the **[Field Manual Engine](https://github.com/Emposes/field-manual-engine)** —
a topic-agnostic Claude Code skill. Install it and ask Claude Code for
*"an interactive field manual about espresso"* (or options trading, or Roman
aqueducts) and you get a site with this same craft, about your topic.

## Develop

```bash
python3 -m http.server 4173        # serve locally
node scripts/build.mjs             # regenerate search index, llms.txt, sitemap
npx vercel deploy --prod --yes     # deploy
```

## Corrections

Found an error? Open an issue. An encyclopedia is only as good as its correction
loop — technical errata are prioritized.

MIT licensed. Built with [Claude Code](https://claude.com/claude-code) (Fable 5) —
the four new volumes were written by a 27-agent parallel fleet in a single session.
