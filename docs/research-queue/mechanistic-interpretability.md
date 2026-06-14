# Proposal: Mechanistic Interpretability & Sparse Autoencoders

**Track:** `chapters` (Vol II — AI Systems)
**Level:** advanced
**Suggested slug:** `chapters/13-mechanistic-interpretability.html`
**Scouted:** 2026-06-14

---

## Thesis

SHAP and LIME explain predictions by attributing credit to input features. Mechanistic interpretability goes a level deeper: it asks what *computations* the model is performing, implemented in which weights, in which layers. The central tools are circuit analysis (tracing information flow through specific attention heads and MLPs) and sparse autoencoders (decomposing polysemantic neurons into monosemantic feature directions). The result is a causal map of what a model knows and how it uses that knowledge — a prerequisite for genuinely auditable AI.

## Why now

- Anthropic's "Scaling Monosemanticity" (2024) showed sparse autoencoders (SAEs) recover interpretable features from Claude 3 Sonnet at scale — the first credible evidence the circuit-discovery approach works on frontier models.
- Independent groups (OpenAI, EleutherAI, academic labs) have confirmed SAE results; a systematic survey was published (arXiv:2503.05613, March 2025).
- Mechanistic interpretability is cited in EU AI Act compliance discussions and by safety researchers as the path to *verifiable* alignment — making this durable, not hype.
- The encyclopedia's explainability chapter (`mlops/06`) covers SHAP, LIME, permutation importance — all prediction-level methods. Mechanistic interpretability is **completely absent** from `content.json`.

## Proposed section outline

1. **Why prediction-level XAI is not enough** — SHAP on a transformer tells you *which tokens* mattered; it does not tell you *what the model did* with them
2. **The circuits hypothesis** — attention heads as primitive operations (induction heads, name-mover heads); composition; the residual stream as shared workspace
3. **Superposition and polysemanticity** — more concepts than neurons; the linear representation hypothesis; why neurons are mixed
4. **Sparse autoencoders** — reconstructing activations with sparse, overcomplete dictionaries; training objective; dictionary size trade-offs
5. **Feature steering** — subtracting or amplifying feature directions to alter model behavior; causal validation
6. **Results at scale** — what SAEs found in Claude 3 Sonnet; safety-relevant features; limitations and open problems
7. **References**

## Key primary sources

- Elhage et al. (2021). *A Mathematical Framework for Transformer Circuits.* transformer-circuits.pub/2021/framework
- Elhage et al. (2022). *Toy Models of Superposition.* transformer-circuits.pub/2022/toy_model
- Cunningham et al. (2023). *Sparse Autoencoders Find Highly Interpretable Features in Language Models.* arXiv:2309.08600
- Templeton et al. (2024). *Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet.* transformer-circuits.pub/2024/scaling-monosemanticity
- Lieberum et al. (2023). *Does Circuit Analysis Interpretability Scale?* arXiv:2307.09458
- SAE Survey (2025). arXiv:2503.05613

## Connections to existing chapters

- Builds on: `chapters/02-transformer` (residual stream, attention heads), `chapters/03-attention`
- Adjacent to: `mlops/06-explainability` (distinct focus; both should exist)
- Relevant to: `openmodels/05-red-teaming` (feature steering as a safety probe)

## What NOT to author yet

Do not write the full chapter. This stub is a proposal. Wait for human go-ahead, then author via the normal `author-wave.workflow.mjs` fleet + build gate.
