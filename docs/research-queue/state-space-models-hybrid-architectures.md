# Proposal: State Space Models & Hybrid Architectures

**Track:** `dl` · **Level:** advanced · **Proposed slug:** `dl/08-state-space-models`
**Kind:** new chapter

## Summary

The `dl` track goes from foundations through CNNs, sequence models (RNN/LSTM),
seq2seq/attention, autoencoders, GANs, and training practice — but stops before
the architecture that has become attention's main structural challenger. State
Space Models (S4, then Mamba) replaced the quadratic cost of attention with a
linear-time recurrence, and by mid-2026 the frontier open-weight landscape has
converged on **hybrids** that interleave a handful of attention layers with
many cheap SSM layers: NVIDIA's Nemotron 3 Ultra (550B/55B-active MoE, 1M
context) and Arcee's Trinity Large both shipped hybrid Mamba/attention
technical reports in the last two months, following AI21's Jamba and Zyphra's
Zamba before them. This is a real, cross-lab convergent architecture pattern,
not a single vendor's bet, and the encyclopedia currently has no coverage of
SSMs at all.

## Thesis

Attention computes pairwise interactions between every pair of tokens — the
source of both its expressiveness and its quadratic cost. A state space model
instead compresses the sequence into a fixed-size recurrent state, updated
one token at a time in linear time, using the same linear-recurrence math as
a Kalman filter. S4 made this trainable at scale via a structured
parameterization; Mamba made the recurrence input-dependent ("selective"),
closing most of the quality gap with attention; and 2025-2026's production
models establish the current practical answer: pure SSMs still lag attention
on associative-recall-heavy tasks, so the deployed pattern is a hybrid — a
sparse lattice of attention layers for recall, dense SSM layers for
throughput and long-context memory.

## Proposed sections

1. **Why attention is expensive** — recap the \(O(n^2)\) cost from `chapters/03`; what a fixed-size recurrent state buys back
2. **Structured State Spaces (S4)** — the continuous-time SSM, HiPPO initialization, the convolutional vs. recurrent dual view
3. **Mamba: selective state spaces** — input-dependent (Δ, B, C); why selectivity closes the gap to attention; the hardware-aware parallel scan
4. **Mamba-2 and structured state-space duality** — the formal link between SSMs and linear attention
5. **Hybrid architectures** — Jamba, Zamba, Nemotron 3, Arcee Trinity: interleaving ratios, why hybrids beat pure-SSM or pure-attention at equal budget
6. **Trade-offs in practice** — long-context throughput and memory vs. associative-recall failure modes of pure SSMs; when to reach for a hybrid
7. References

## Primary sources

| Paper | Link |
|---|---|
| Gu, Goel & Ré (2022) — Efficiently Modeling Long Sequences with Structured State Spaces (S4), ICLR 2022 | [arXiv:2111.00396](https://arxiv.org/abs/2111.00396) |
| Gu & Dao (2023) — Mamba: Linear-Time Sequence Modeling with Selective State Spaces | [arXiv:2312.00752](https://arxiv.org/abs/2312.00752) |
| Dao & Gu (2024) — Transformers are SSMs: Structured State Space Duality (Mamba-2), ICML 2024 | [arXiv:2405.21060](https://arxiv.org/abs/2405.21060) |
| Lieber et al. (2024) — Jamba: A Hybrid Transformer-Mamba Language Model (AI21) | [arXiv:2403.19887](https://arxiv.org/abs/2403.19887) |
| Glorioso et al. (2024) — Zamba: A Compact 7B SSM Hybrid Model (Zyphra) | [arXiv:2405.16712](https://arxiv.org/abs/2405.16712) |
| NVIDIA (2026) — Nemotron 3 Ultra: Open, Efficient MoE Hybrid Mamba-Transformer Model | [arXiv:2606.15007](https://arxiv.org/abs/2606.15007) |
| Arcee AI (2026) — Arcee Trinity Large Technical Report | [arXiv:2602.17004](https://arxiv.org/abs/2602.17004) |

## Relationship to existing content

- `dl/03-sequence-models` — RNN/LSTM as the classical recurrent baseline; SSMs are their modern, parallelizable descendant
- `chapters/03-attention` — the cost SSMs are trying to avoid; cross-reference the \(O(n^2)\) discussion
- `chapters/15` (proposed, MoE, issue #14) — Nemotron 3 and Trinity are also MoE; the two proposals should cross-reference each other once both exist
- `chapters/08-inference` — long-context serving cost is where the hybrid pitch is made concretely

## Durability

**HIGH.** S4 (2021) and Mamba (2023) are two-to-five-year-old, heavily-cited,
independently-reproduced results — not a single week's hype. The hybrid
pattern is now corroborated by four independent labs (AI21, Zyphra, NVIDIA,
Arcee) across an 18-month span, which is the strongest signal available that
this is a stable architecture family rather than a fad. The chapter will need
periodic updates as new hybrids ship, but the core SSM math will not be
superseded.

---

*Filed by research-scout · 2026-07-20. Propose only — do not author the full chapter unprompted.*
