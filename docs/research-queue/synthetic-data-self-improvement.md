# Proposal: Synthetic Data & Model Self-Improvement

**Track:** chapters (Vol II – AI Systems)  
**Level:** advanced  
**Part:** AI Systems  
**Slug:** chapters/16-synthetic-data  
**Proposed:** 2026-06-15  
**Scout run:** research-scout weekly  

---

## Thesis

High-quality human-written text is becoming the binding constraint on LLM pre-training. The response has been synthetic data: model-generated text used to train the next model. Self-improvement loops — where a model generates training data that is filtered, critiqued, or verified before being used to fine-tune itself — have become a central technique for post-training (instruction following, reasoning, coding) and, increasingly, continued pre-training. The scaling laws of synthetic data differ from those of natural data; the failure modes (model collapse, distribution narrowing) are distinct; the quality filters (verifiable correctness, reward models, constitutional principles) are a craft in themselves. No existing chapter addresses this topic.

---

## Why this gap matters

The pre-training chapter (ch.04) covers web data curation and scaling laws for natural corpora. The post-training chapter (ch.05) mentions Constitutional AI and RLAIF in §8 but not the data generation pipeline. The fine-tuning and open-models chapters assume the dataset exists. Readers building training pipelines for open models have no encyclopedic treatment of how to generate, filter, and mix synthetic data safely.

---

## Proposed section outline

1. **Why synthetic data** — natural data scarcity; compute abundance; the data-compute imbalance by 2025  
2. **Instruction data generation** — Self-Instruct; Alpaca; Evol-Instruct; quality vs diversity; deduplication  
3. **Filtering pipelines** — reward model scoring; constitutional filtering; rule-based verifiers; IFEval-style exactness checks  
4. **Self-play and self-improvement loops** — STaR / ReST; SPIN; iterative DPO; when loops converge vs diverge  
5. **Synthetic pre-training corpora** — phi-1 "textbooks"; code synthesis; math synthesis (ORCA-Math, NuminaMath); scaling laws for synthetic pre-training  
6. **Model collapse** — what it is; empirical evidence; mitigation (mixing natural data, diverse generators)  
7. **Verifiable domains as a special case** — math, code, formal proofs; why verifiability breaks the reward-hacking loop  
8. **References**

---

## Key primary sources

- Wang et al. (2023). "Self-Instruct: Aligning Language Models with Self-Generated Instructions." ACL 2023. arXiv:2212.10560  
- Gunasekar et al. (2023). "Textbooks Are All You Need." (phi-1) arXiv:2306.11644  
- Zelikman et al. (2022). "STaR: Bootstrapping Reasoning with Reasoning." NeurIPS 2022. arXiv:2203.14465  
- Yuan et al. (2024). "Self-Play Fine-Tuning Converts Weak Language Models to Strong Language Models." (SPIN) ICML 2024. arXiv:2401.01335  
- Shumailov et al. (2024). "AI Models Collapse when Trained on Recursively Generated Data." Nature. arXiv:2305.17493  
- Busbridge et al. (2025). "Scaling Laws of Synthetic Data for Language Models." arXiv:2503.19551  
- Kang et al. (2025). "Demystifying Synthetic Data in LLM Pre-training." arXiv:2510.01631  
- Bai et al. (2022). "Constitutional AI: Harmlessness from AI Feedback." arXiv:2212.08073  

---

## Durability assessment

**HIGH.** Synthetic data is not a temporary workaround; it is how the field has solved the data-ceiling problem and will remain central as long as models continue to scale. The failure modes (model collapse, reward hacking) are permanent concerns, not temporary bugs. The section on verifiable domains connects directly to the reasoning-model content already in ch.05 and ch.12.

---

## Relationship to existing content

- ch.04 Pre-training: brief cross-reference to synthetic corpora in §1 "Data"  
- ch.05 Post-training §8 "Constitutional AI & RLAIF" would point to this chapter for the data generation mechanics  
- ch.12 Inference-time scaling §5 on "Thinking longer" connects to verifiable-reward loops described here

---

## Guardrails note

Do not author the full chapter without a human go-ahead. This file is the stub to enable the decision.
