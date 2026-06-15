# Proposal: Mixture of Experts — Architecture, Routing & Training

**Track:** chapters (Vol II – AI Systems)  
**Level:** advanced  
**Part:** AI Systems  
**Slug:** chapters/15-mixture-of-experts  
**Proposed:** 2026-06-15  
**Scout run:** research-scout weekly  

---

## Thesis

Every frontier language model deployed at scale in 2024-2026 uses sparse Mixture of Experts (MoE): GPT-4, Gemini 1.5/2.0, DeepSeek-V3, Mixtral 8x7B/8x22B, Llama 3.1, and Grok-2. MoE replaces the dense MLP in each Transformer block with *N* expert MLPs and a learned router that activates only *k* of them per token. This gives model capacity (total parameters) that grows cheaply while keeping per-token compute constant. The current encyclopedia mentions MoE in ch.09 Frontier §1 in a single paragraph without equations or routing mechanics. Practitioners encountering MoE in the literature need to understand routing algorithms, load balancing losses, expert collapse, and the deployment challenges of expert parallelism.

---

## Why this gap matters

MoE is not a frontier curiosity; it is the standard architecture for any model trained at tens of billions of parameters and above. The MLOps chapter covers production deployment but cannot explain why inference for Mixtral requires routing-aware batching. The compression chapter explains quantization but not the expert-skipping dynamics that change the arithmetic of memory-bandwidth-bound decode.

---

## Proposed section outline

1. **The MoE idea** — capacity vs compute; the dense MLP replaced by *N* experts; top-*k* gating  
2. **Routing algorithms** — token-choice (top-k softmax); expert-choice routing; auxiliary load-balancing loss; z-loss  
3. **Training dynamics** — expert collapse; router jitter noise; the importance of balanced routing for stable training  
4. **Architecture variants** — Switch Transformer (k=1); Mixtral (k=2, 8 experts); fine-grained expert granularity in DeepSeek-V3; shared experts  
5. **Expert parallelism** — EP as a new dimension of model parallelism; all-to-all communication cost; token-dropping under expert capacity  
6. **Inference engineering** — why MoE decode is memory-bound differently from dense; offloading inactive experts; speculative MoE routing  
7. **Open questions** — why MoE outperforms IsoFLOP dense; do experts specialise by topic?; continual learning under routing constraints  
8. **References**

---

## Key primary sources

- Shazeer et al. (2017). "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer." ICLR 2017. arXiv:1701.06538  
- Fedus, Zoph & Shazeer (2021). "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity." JMLR. arXiv:2101.03961  
- Zoph et al. (2022). "ST-MoE: Designing Stable and Transferable Sparse Expert Models." arXiv:2202.08906  
- Jiang et al. (2024). "Mixtral of Experts." arXiv:2401.04088  
- DeepSeek-AI (2024). "DeepSeek-V3 Technical Report." arXiv:2412.19437  
- Intuition Labs (2025). "Understanding Mixture of Experts (MoE) Neural Networks." Technical overview, Sep 2025.

---

## Durability assessment

**HIGH.** MoE is the scaling solution that closed the gap between dense-model compute cost and frontier capability. It is entrenched in hardware (H100/B200 NVLink topology was co-designed with MoE EP communication patterns). This is not a trend; it is the default architecture for large models for the foreseeable future.

---

## Relationship to existing content

- ch.09 Frontier §1 ("Mixture-of-Experts: capacity without the bill") would be retargeted as an intro and pointer to this chapter.  
- ch.08 Inference §§ on batching and memory-bound decode would cross-reference MoE routing dynamics.  
- ch.04 Pre-training §§ on parallelism would reference expert parallelism as a new axis.

---

## Guardrails note

Do not author the full chapter without a human go-ahead. This file is the stub to enable the decision.
