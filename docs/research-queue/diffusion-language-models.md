# Proposal stub: Diffusion Language Models

**Status:** proposed 2026-08-17 by research-scout · not authored · needs human go-ahead
**Track / slot:** `chapters` (Volume II), tentatively `chapters/19-diffusion-language-models.html` —
or, if the fleet judges it's better as a deep expansion rather than a standalone chapter,
grow the existing "Text diffusion: the parallel challenger" section of
`chapters/10-diffusion.html` into a full treatment. Editorial call, not scout's to make.

## Why this, why now

`chapters/10-diffusion.html` already has a section, "Text diffusion: the parallel
challenger," and it's accurate as far as it goes — but it's one of six sections in a
chapter whose center of gravity is image/video diffusion, and it predates the last two
years of dLLM maturation. Three independent lines of evidence say the topic has outgrown
that treatment:

1. **A second commercial LLM family now exists that isn't autoregressive.** Inception
   Labs' Mercury (and Mercury Coder) ships a public API and claims 5-10x the tokens/sec
   of speed-optimized AR models at comparable quality on real benchmarks (Copilot Arena).
   That's a production system, not a research demo.
2. **Google DeepMind's Gemini Diffusion** is a second, independently-developed dLLM at
   frontier-lab scale, with the same qualitative claim (order-of-magnitude decode speed,
   parallel block generation, in-generation self-correction). Two labs converging on the
   same non-autoregressive bet independently is the signal that matters, not the demo.
3. **The open research line has scaled, not stalled.** LLaDA went from an 8B proof-of-concept
   (2.3T training tokens) to LLaDA 2.2 / "Improved LLaDA" at 12T tokens with full
   bidirectional attention, and a survey (arXiv:2508.10875) now catalogs ~90 dLLM papers
   from Feb–May 2026 alone across decoding, hybrid AR/diffusion methods, and RL-tuned
   variants (e.g. dUltra).

This isn't "diffusion for images, but for text now" trivia — it's a genuinely different
generation mechanism (iterative denoising / remasking over a full sequence instead of
left-to-right sampling) with real, measured throughput and editability consequences, and
it now has two shipping products behind it. That clears the durability bar the existing
one-section treatment doesn't fully capture.

## What's NOT the gap

RLVR / verifiable rewards is already well covered in `rl/06-rl-and-llms.html` ("GRPO &
RLVR — verifiable rewards"). Standard image/video diffusion mechanics (forward process,
score matching, classifier-free guidance, latent diffusion, flow matching) are already
covered in `chapters/10-diffusion.html` and don't need duplication — the new material
should build on those sections' math rather than re-deriving it.

## Suggested thesis

Diffusion language models replace next-token autoregression with iterative denoising
over the whole sequence (usually via discrete masking rather than continuous Gaussian
noise). That single change flips the cost/latency profile — generation parallelizes
across positions instead of serializing token-by-token — at the cost of a different
(and still-maturing) quality/robustness story, and it changes what "sampling" even means
for interactive editing.

## Suggested section outline

1. Why autoregression isn't free: the sequential-decode bottleneck it's solving
2. Masked diffusion for discrete tokens: the forward corruption + reverse remask process
   (bridge from Vol II §10.1–10.2's continuous-noise treatment to discrete-token masking)
3. Any-order generation: parallel block decoding, infilling, and self-correction —
   what you get that AR sampling structurally can't do
4. Training objective: the likelihood lower bound vs. denoising score matching,
   and why dLLM pretraining compute has scaled from ~8B/2.3T tokens (LLaDA) to
   ~8B/12T tokens (LLaDA 2.2) in under two years
5. The honest cost side: quality-vs-AR gaps, remasking-schedule sensitivity, and
   why most dLLMs today are still mid-size (8B–ish) rather than frontier-scale
6. Where it's shipping: Mercury/Mercury Coder (commercial API, coding-focused) and
   Gemini Diffusion (research prototype) as two independent bets on the same idea
7. References

## Key primary sources (verify + expand before drafting)

- Nie, S. et al. (2025). *Large Language Diffusion Models.* arXiv:2502.09992 — the LLaDA paper.
- (2026). *Improved Large Language Diffusion Models.* arXiv:2606.25331 — LLaDA scaled to 12T tokens, full bidirectional attention.
- Inception Labs (2025). *Mercury: Ultra-Fast Language Models Based on Diffusion.* arXiv:2506.17298.
- Google DeepMind. *Gemini Diffusion.* https://deepmind.google/models/gemini-diffusion/ (research prototype announcement).
- (2026). *A Survey on Diffusion Language Models.* arXiv:2508.10875 — for the decoding-method taxonomy (remasking schedules, confidence-based unmasking, hybrid AR/diffusion) in section 3.

## Coverage check performed

- Searched `content.json` for `diffusion`, `dLLM`, `masked language`, `text diffusion` —
  only hit is the existing subsection in `chapters/10-diffusion.html` noted above.
- Cross-checked against all 15 currently-open `research`+`proposal` issues (as of
  2026-08-17): none address diffusion language models.
