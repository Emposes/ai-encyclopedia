# Proposal: AI Safety & Scalable Oversight (chapters/18)

**Track:** `chapters` (Vol II) · **Level:** advanced · **Proposed slug:** `chapters/18-ai-safety`

---

## Thesis

The encyclopedia covers alignment techniques as engineering steps: RLHF in `chapters/05`,
Constitutional AI in `chapters/05 §8`, red-teaming as a deployment practice in
`openmodels/05`, and mechanistic interpretability as a science in `chapters/13`. What is
missing is the *conceptual frame* that gives those techniques their stakes — the alignment
problem itself, its canonical threat models, and the research agenda designed to address them.
This chapter fills that gap: why misalignment is a serious risk as models scale toward
greater autonomy, what the main technical approaches are (scalable oversight, debate,
interpretability-as-safety, AI control), and how they connect to deployed practice.

---

## Proposed sections

1. **The alignment problem** — the reward-specification problem; Goodhart's law at scale;
   mesa-optimisers and inner alignment; the distinction between capability and corrigibility
2. **Threat models** — deceptive alignment; goal misgeneralisation; specification gaming;
   why these are harder to detect as capabilities increase
3. **Scalable oversight** — the supervisory bottleneck; process reward models vs outcome
   reward models; weak-to-strong generalisation (Burns et al. 2023/2024); iterated
   amplification (Christiano et al. 2018)
4. **Debate as a safety technique** — the debate game; cross-examination; theoretical
   guarantees and empirical limits; DeepMind's debate deployment in 2026
5. **Interpretability as a safety tool** — from `chapters/13` to safety applications;
   activation steering for anomaly detection; eliciting latent knowledge (ELK)
6. **AI Control** — the AI control framework (Greenblatt et al. 2023); trusted monitoring;
   sandbagging detection; DeepMind's AI Control Roadmap (June 2026)
7. **Practical safety work today** — Anthropic's Responsible Scaling Policy; the METR threat
   model evaluations; frontier safety frameworks; the International AI Safety Report 2026
8. **References**

---

## Primary sources

- Russell, S. (2019). *Human Compatible: Artificial Intelligence and the Problem of Control*. Viking.
- Christiano, P. et al. (2018). "Supervising Strong Learners by Amplifying Weak Experts." [arXiv:1810.08575](https://arxiv.org/abs/1810.08575)
- Irving, G. et al. (2018). "AI Safety via Debate." [arXiv:1805.00899](https://arxiv.org/abs/1805.00899)
- Burns, C. et al. (2023). "Weak-to-Strong Generalization." [arXiv:2312.09390](https://arxiv.org/abs/2312.09390)
- Greenblatt, R. et al. (2024). "AI Control: Improving Safety Despite Intentional Subversion." [arXiv:2312.06942](https://arxiv.org/abs/2312.06942)
- Hadfield-Menell, D. et al. (2016). "Cooperative Inverse Reinforcement Learning." NeurIPS 2016. [arXiv:1606.03137](https://arxiv.org/abs/1606.03137)
- Bengio, Y. et al. (2026). "International AI Safety Report 2026." [arXiv:2602.21012](https://arxiv.org/abs/2602.21012)
- Bengio, Y. et al. (2025). "The Singapore Consensus on Global AI Safety Research Priorities." [arXiv:2506.20702](https://arxiv.org/abs/2506.20702) — published June 2026.
- Krakovna, V. et al. (2020). "Specification Gaming: The Flip Side of AI Ingenuity." DeepMind Blog.
- Google DeepMind (2026). "Securing the Future of AI Agents: An AI Control Roadmap." Blog post, June 2026.

---

## Relationship to existing content

- `chapters/05` Post-training §8 "Constitutional AI & RLAIF" — operational technique; this chapter is the safety framing around it
- `chapters/12` Inference-Time Compute — process reward models appear in both; cross-reference
- `chapters/13` Mechanistic Interpretability §6 "Feature steering, and honest limits" — interpretability for safety; link explicitly
- `openmodels/05` Red-Teaming, Jailbreaks & Safety — empirical attack surface; this chapter covers the theoretical alignment frame

---

## Why now

The Singapore Consensus on Global AI Safety Research Priorities (arXiv:2506.20702) was
published this week (late June 2026) by Yoshua Bengio and over 100 co-authors, building on the
*International AI Safety Report 2026* (arXiv:2602.21012) backed by 33 governments. DeepMind
published its AI Control Roadmap in June 2026. Anthropic's 2026 Fellows Program explicitly
funds scalable oversight, AI control, and interpretability-for-safety research. The field has
moved from theoretical concern to active engineering practice, and an encyclopedia of AI
Systems without a chapter on alignment is increasingly incomplete.

---

## Durability

**HIGH.** The alignment problem does not become easier as capabilities increase. The concepts
here (scalable oversight, corrigibility, inner alignment) are stable theoretical constructs
that pre-date the current wave of LLMs and will remain relevant as autonomy increases. The
Singapore Consensus and International Safety Report signal governmental consensus, making this
a durable policy and engineering reference. The chapter will need updating as specific
techniques evolve, but the frame will not be obsolete.

---

*Filed by research-scout 2026-06-29. Propose only — do not author the full chapter unprompted.*
