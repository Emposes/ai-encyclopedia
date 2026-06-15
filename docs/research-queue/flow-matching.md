# Proposal: Flow Matching & Rectified Flow

**Track:** chapters (Vol II – AI Systems)  
**Level:** advanced  
**Part:** AI Systems  
**Slug:** chapters/14-flow-matching  
**Proposed:** 2026-06-15  
**Scout run:** research-scout weekly  

---

## Thesis

Diffusion models (chapter 10) learn to reverse a *stochastic* noise process defined by an SDE. Flow matching learns to transport between distributions along *deterministic* ODE trajectories, regressing a vector field that maps noise to data in straight (or near-straight) paths. This reformulation is faster to sample, more stable to train, and has displaced DDPM as the default backbone in the leading image and video generation systems of 2025-2026 — Stable Diffusion 3, FLUX, and Sora-class video generators all use rectified flow or conditional flow matching. The diffusion chapter (ch.10 §4) has a one-paragraph mention; the technique warrants a full treatment.

---

## Why this gap matters

ICLR 2026 received 150+ flow-matching submissions; NeurIPS 2025 accepted 30+ FM papers. Flow matching is now the primary generative paradigm for images, video, audio, and structured molecular data. Readers of ch.10 are left without the mathematical machinery to understand current production systems.

---

## Proposed section outline

1. **From diffusion SDEs to probability flow ODEs** — recap why diffusion works; transition from stochastic to deterministic transport  
2. **Conditional Flow Matching (CFM)** — the CFM objective; regressing vector fields without simulating ODEs during training  
3. **Rectified Flow** — linear interpolation paths; straightening via reflow; why straight paths mean fewer NFE  
4. **Optimal transport conditioning** — mini-batch OT couplings; reducing variance and improving training efficiency  
5. **Discrete and Riemannian extensions** — masked diffusion / MDLM for text; Riemannian FM for molecular geometry  
6. **Production architectures** — DiT (Diffusion Transformer) backbone; CFG with FM; SD3 and FLUX as case studies  
7. **FM vs diffusion: when each wins** — inference speed, training stability, controllability trade-offs  
8. **References**

---

## Key primary sources

- Lipman et al. (2022). "Flow Matching for Generative Modeling." ICLR 2023. arXiv:2210.02747  
- Liu, Gong & Liu (2022). "Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow." ICLR 2023. arXiv:2209.03003  
- Tong et al. (2023). "Improving and Generalizing Flow Matching for Generative Modeling." arXiv:2302.00482  
- Esser et al. (2024). "Scaling Rectified Flow Transformers for High-Resolution Image Synthesis." (SD3) arXiv:2403.03206  
- Albergo & Vanden-Eijnden (2022). "Building Normalizing Flows with Stochastic Interpolants." ICLR 2023. arXiv:2209.15571  
- Chen et al. (2025). "Flow Matching Meets Biology and Life Science: A Survey." npj Artificial Intelligence. arXiv:2507.17731 (preprint series)

---

## Durability assessment

**HIGH.** Rectified flow is now the default training objective for the most widely deployed image/video generation systems. The mathematical basis (ODE transport, vector field regression) is stable theory. FM's displacement of DDPM is the same kind of durable shift as Adam displacing SGD-momentum.

---

## Relationship to existing content

- ch.10 Diffusion §4 currently has one paragraph on "latent diffusion & flow matching"; that section would be updated to point to this chapter.  
- No other existing chapter overlaps.

---

## Guardrails note

Do not author the full chapter without a human go-ahead. This file is the stub to enable the decision.
