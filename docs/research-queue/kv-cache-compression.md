# Proposal: KV-Cache Compression & Quantization

**Track:** `chapters` (Vol II) · **Level:** advanced · **Target:** expand `chapters/07-compression.html`
**Kind:** section addition to an existing chapter (not a new chapter)

## Summary

`chapters/07-compression` covers model-weight compression (quantization,
pruning, distillation). It does not cover **KV-cache compression** — a
separate, now-standard lever for serving long-context models, where the
memory bottleneck at inference time is the growing key/value cache, not the
weights. This has matured into a well-defined technique family (eviction,
windowing, quantization) with real production adoption: Google's TurboQuant
was merged into vLLM within about 100 days of its ICLR 2026 publication.

## Thesis

For long-context decoding, the KV cache — not the model weights — is often
the binding memory constraint, growing linearly with sequence length and
batch size. Three complementary strategies have emerged: **evict** low-value
entries (H2O keeps only "heavy hitter" tokens), **window** with a fixed
attention sink (StreamingLLM), or **quantize** the cache itself down to 2-3
bits per value (KIVI, TurboQuant) using distribution-aware transforms rather
than naive rounding. This section gives readers the vocabulary and trade-offs
for the inference-serving lever they are most likely to reach for after model
quantization.

## Proposed section outline (insert as new §N in `chapters/07-compression`)

1. The KV cache as a separate memory budget from weights — recap from `chapters/08-inference`'s batching discussion
2. Eviction: H2O's heavy-hitter oracle — the observation that a small token subset dominates attention mass
3. Windowing: StreamingLLM's attention sinks — why keeping the first few tokens recovers most of the quality
4. Quantization: KIVI (per-channel keys, per-token values) and TurboQuant (rotation + Lloyd-Max + a 1-bit residual correction) — 2-3 bit caches at near-zero measured accuracy loss
5. When each strategy wins — eviction/windowing lose long-range recall; quantization is close to lossless but needs a compute-aware transform, not naive rounding

## Primary sources

| Paper | Link |
|---|---|
| Zhang et al. (2023) — H2O: Heavy-Hitter Oracle for Efficient Generative Inference of LLMs, NeurIPS 2023 | [arXiv:2306.14048](https://arxiv.org/abs/2306.14048) |
| Xiao et al. (2023) — Efficient Streaming Language Models with Attention Sinks, ICLR 2024 | [arXiv:2309.17453](https://arxiv.org/abs/2309.17453) |
| Liu et al. (2024) — KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache, ICML 2024 | [arXiv:2402.02750](https://arxiv.org/abs/2402.02750) |
| Google Research (2025/2026) — TurboQuant: Online Vector Quantization with Near-Optimal Distortion Rate, ICLR 2026 | [arXiv:2504.19874](https://arxiv.org/abs/2504.19874) |

Note: the original scout sweep cited an incorrect arXiv id for TurboQuant
(2606.15007, which is actually the unrelated Nemotron 3 Ultra paper); the id
above was verified directly against arXiv before filing this proposal.

## Relationship to existing content

- `chapters/07-compression` — direct target; sits alongside weight quantization as "the other half" of memory compression
- `chapters/08-inference` — batching/memory-bound decode discussion should cross-reference this section
- `dl/08-state-space-models` (proposed above) — SSM hybrids sidestep the KV-cache problem differently; worth one cross-reference sentence once both exist

## Durability

**HIGH.** H2O and StreamingLLM are 2023-vintage, heavily cited, and now
textbook-standard baselines; KIVI and TurboQuant extend the same idea with
better quantization math. TurboQuant's vLLM merge is concrete evidence of
production adoption, not just benchmark chasing.

---

*Filed by research-scout · 2026-07-20. Propose only — do not edit the shipped chapter unprompted.*
