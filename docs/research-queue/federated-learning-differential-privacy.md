# Stub: Federated Learning & Differential Privacy

**Proposed slug:** `ml/17-federated-learning`
**Track:** `ml` · **Level:** advanced · **Part:** Classical ML

---

## Thesis

Most ML algorithms in this encyclopedia assume training data is pooled on a single machine.
Federated Learning (FL) breaks that assumption: the model travels to the data, not the reverse.
Gradient updates—never raw samples—are aggregated across clients (phones, hospitals, banks),
with Differential Privacy (DP) providing a formal mathematical guarantee that the aggregate
reveals nothing about any individual's data. FL+DP is now the dominant architecture for
privacy-compliant ML in regulated industries and on-device training at billion-device scale.

---

## Why a standalone chapter

- No existing chapter addresses decentralised training or formal privacy guarantees.
- `openmodels/04` §5 covers catastrophic forgetting and `mlops/07` covers governance, but
  neither touches on the training system or the privacy math.
- The topic spans two auditable primitives—communication-efficient optimisation (FedAvg)
  and a composable privacy accounting mechanism (DP)—whose interaction is non-trivial and
  increasingly regulated (GDPR Art. 25, US Executive Order on AI §4.2).
- Active June 2026 research confirms the area is live: two new arXiv papers on
  privacy-preserving FL under adversarial settings (2506.12846, 2506.23622) and a survey
  tracing DP from symbolic AI to LLMs (2506.11687).

---

## Proposed sections

1. **Why federated learning** — pooled data is the exception; data sovereignty, regulation,
   latency, and device-scale are the rule; FL reframes the training contract
2. **FedAvg — the canonical algorithm** — local SGD + global aggregation; communication
   rounds; non-IID data and client drift; convergence theory sketch
3. **The privacy threat model** — gradient inversion attacks; model inversion; membership
   inference; why weight sharing alone is insufficient
4. **Differential Privacy — the formal guarantee** — ε-δ DP definition; sensitivity;
   the Gaussian and Laplace mechanisms; composition theorems; privacy budget accounting
5. **DP-SGD — clipping gradients and adding noise** — per-sample gradient clipping;
   Abadi et al. (2016) moment accountant; privacy amplification via subsampling
6. **Federated DP in practice** — DP-FedAvg; secure aggregation (cryptographic masking);
   the accuracy-privacy trade-off at scale; Apple, Google deployments
7. **Open challenges** — heterogeneous clients; communication compression; vertical FL;
   personalised FL; FL for LLM fine-tuning (DP LoRA)
8. **References**

---

## Primary sources

- McMahan et al. (2017). "Communication-Efficient Learning of Deep Networks from
  Decentralized Data." AISTATS 2017. arXiv:1602.05629
- Dwork, C. (2006). "Differential Privacy." ICALP 2006.
- Dwork, C. & Roth, A. (2014). "The Algorithmic Foundations of Differential Privacy."
  *Foundations and Trends in Theoretical Computer Science*, 9(3–4).
- Abadi et al. (2016). "Deep Learning with Differential Privacy." CCS 2016.
- Kairouz et al. (2021). "Advances and Open Problems in Federated Learning."
  *Foundations and Trends in Machine Learning*. arXiv:1912.04977
- Li et al. (2020). "Federated Learning: Challenges, Methods, and Future Directions."
  *IEEE Signal Processing Magazine*, 37(3).
- Bonawitz et al. (2022). "Federated Learning and Privacy." *ACM Queue*, 19(5).
- Triastcyn & Faltings (2020). "Federated Learning with Bayesian Differential Privacy."
  IEEE Big Data 2020.
- arXiv:2506.11687 (June 2026). "Differential Privacy in Machine Learning: A Survey from
  Symbolic AI to LLMs." — confirms active area with LLM-era extensions
- arXiv:2506.12846 (June 2026). "VFEFL: Privacy-Preserving Federated Learning against
  Malicious Clients via Verifiable Functional Encryption."
- arXiv:2506.23622 (June 2026). "Privacy-Preserving Federated Learning Scheme with
  Mitigating Model Poisoning Attacks." IJCAI-ECAI 2026 adjacent.

---

## Relationship to existing content

- `ml/06` Generalisation §3 "Regularization" — cross-reference: DP-SGD adds structured
  noise that acts as a regulariser; link from this chapter
- `mlops/07` MLOps & Governance §5 "Model risk management" — cross-reference: FL is a
  primary technique for privacy-by-design compliance; link from this chapter
- `openmodels/04` §5 "Catastrophic forgetting" — cross-reference: client drift in FL is
  analogous to domain shift; link bidirectionally
- `chapters/06` Fine-tuning — brief note: DP-LoRA for fine-tuning LLMs without leaking
  training data is an emerging application; cross-reference here

---

## Durability

**HIGH.** FedAvg has been in production at Google and Apple since 2017 (GBoard, iOS) and is
now deployed across healthcare (NHS federated imaging, NVIDIA FLARE), banking (SWIFT
anti-money-laundering consortium), and autonomous driving (cross-fleet learning). Privacy
regulation (GDPR, CCPA, US AI EO) is tightening, not loosening. DP is a mathematical
guarantee, not a heuristic—it will not be superseded by a better technique any more than
RSA was "superseded" by faster factoring heuristics. The applied area will grow, but the
foundational chapter content is stable for years.

---

*Filed by research-scout 2026-06-22. Propose only — do not author the full chapter unprompted.*
