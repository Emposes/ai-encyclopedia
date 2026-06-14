# Proposal: Model Merging & Task Vectors

**Track:** `openmodels`
**Level:** advanced
**Suggested slug:** `openmodels/06-model-merging.html`
**Scouted:** 2026-06-14

---

## Thesis

Fine-tuned models can be combined without any retraining by operating directly in weight space. A *task vector* is the difference between a fine-tuned model's weights and its base: it encodes the capability delta. Task vectors compose nearly linearly — adding two vectors grants both capabilities; negating one subtracts a behavior. Naive averaging creates parameter interference, which TIES-Merging (trim, elect sign, merge) and DARE (dropout-then-rescale) address. The result is a family of techniques that let practitioners create specialized models without touching a GPU at merge time.

## Why now

- MergeKit (arXiv:2403.13257, 2024) brought these techniques into a practical toolkit with widespread adoption in the open-model community.
- An ACM Computing Surveys paper (arXiv:2603.09938, 2025) now provides a full taxonomy, confirming the field has stabilized enough to be encyclopedic.
- Model merging is central to the Hugging Face open-model ecosystem and is the subject of multiple Kaggle competition winning entries.
- The `openmodels` track covers running, fine-tuning, and training techniques for open models. Model merging — a fourth way to adapt open models — is **not in `content.json`.**

## Proposed section outline

1. **Weight space as a product space** — what it means to average two sets of weights; loss landscape geometry; linear mode connectivity
2. **Task vectors: arithmetic in parameter space** — fine-tune delta as a vector; addition, negation, scaling; Ilharco et al. experiments
3. **SLERP: spherical interpolation for two models** — why Euclidean average of directions fails; the great-circle interpolant; when to use it
4. **TIES-Merging** — parameter interference and sign conflicts; the three-step procedure (trim → elect → merge); multi-model composition
5. **DARE** — random delta dropout; rescaling to preserve expected magnitude; combining DARE with TIES
6. **Evaluation and failure modes** — merging vs. multi-task training; when interference is irreconcilable; benchmarking merged models
7. **References**

## Key primary sources

- Ilharco et al. (2023). *Editing Models with Task Arithmetic.* arXiv:2212.04089 (ICLR 2023)
- Yadav et al. (2023). *TIES-Merging: Resolving Interference When Merging Models.* arXiv:2306.01708 (NeurIPS 2023)
- Yu et al. (2024). *DARE: Language Models are Super Mario.* arXiv:2311.03099
- Goddard et al. (2024). *Arcee's MergeKit: A Toolkit for Merging Large Language Models.* arXiv:2403.13257
- Yang et al. (2025). *Model Merging in LLMs, MLLMs, and Beyond: Methods, Theories, Applications, and Opportunities.* ACM Computing Surveys / arXiv:2603.09938

## Connections to existing chapters

- Builds on: `openmodels/03-finetuning-open` (the source of fine-tuned deltas), `openmodels/04-training-techniques`
- Adjacent to: `chapters/07-compression` (quantization also works in weight space)
- Distinct from fine-tuning: no gradient descent at merge time; weights are combined analytically

## What NOT to author yet

Do not write the full chapter. This stub is a proposal. Wait for human go-ahead, then author via the normal `author-wave.workflow.mjs` fleet + build gate.
