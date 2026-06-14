# Proposal: Inference-Time Scaling

**Track:** `chapters` (Vol II — AI Systems)
**Level:** advanced
**Suggested slug:** `chapters/12-inference-time-scaling.html`
**Scouted:** 2026-06-14

---

## Thesis

Training-time scaling gave us the Chinchilla laws: balance parameters and tokens for a fixed compute budget. A parallel discovery now defines the frontier: you can trade *inference* compute for capability. Letting a model generate extended chain-of-thought, sample many candidates and verify them, or iteratively refine a draft can recover — and sometimes exceed — what training alone cannot achieve. This chapter maps the three scaling regimes (parallel, sequential, internal), the conditions under which each wins, and the boundary where more thinking hurts rather than helps.

## Why now

- OpenAI o1/o3, Google Gemini 2.5 Flash Thinking, DeepSeek-R1, and the s1 paper have all demonstrated reproducible test-time scaling curves in 2024–25.
- "Budget forcing" (s1, arXiv:2501.19393) established a clean experimental handle on the phenomenon.
- Multiple independent studies now agree on a scaling plateau and on the "overthinking" failure mode (arXiv:2604.10739).
- The RL-meets-LLMs chapter (rl/06) covers GRPO/RLVR; post-training chapter covers reasoning models; **neither treats inference-time scaling as a standalone compute axis.** There is no chapter explaining the engineering and theory of how to allocate inference budget.

## Proposed section outline

1. **The new scaling axis** — training compute vs. inference compute; the two-budget view
2. **Parallel scaling** — sampling N candidates; self-consistency / majority vote; Best-of-N with a verifier; the coverage vs. precision trade-off
3. **Sequential scaling** — step-by-step refinement; beam search; process reward models (PRMs) as stepwise verifiers
4. **Internal / "thinking" scaling** — extended chain-of-thought tokens; reasoning models; budget forcing
5. **Compute-optimal inference** — when does more thinking pay? Scaling laws for test-time compute (Snell et al. 2024)
6. **The overthinking ceiling** — marginal returns; token waste on easy problems; adaptive stopping
7. **References**

## Key primary sources

- Snell et al. (2024). *Scaling LLM Test-Time Compute Optimally Improves Reasoning.* arXiv:2408.03314
- Muennighoff et al. (2025). *s1: Simple Test-Time Scaling.* arXiv:2501.19393
- Guo et al. (2025). *DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL.* arXiv:2501.12948
- OpenAI (2024). *Learning to Reason with LLMs.* openai.com/index/learning-to-reason-with-llms
- Sprague et al. (2025). *When More Thinking Hurts: Overthinking in LLM Test-Time Compute Scaling.* arXiv:2604.10739
- "The Art of Scaling Test-Time Compute for LLMs." arXiv:2512.02008

## Connections to existing chapters

- Builds on: `chapters/04-pretraining` (scaling laws), `chapters/05-posttraining` (reasoning models), `rl/06-rl-and-llms` (GRPO/RLVR)
- Extends: `chapters/08-inference` (speculative decoding, batching — the other half of serving efficiency)
- Relevant to: `agents/05-loop-engineering` (test-time compute for agent loops)

## What NOT to author yet

Do not write the full chapter. This stub is a proposal. Wait for human go-ahead, then author via the normal `author-wave.workflow.mjs` fleet + build gate.
