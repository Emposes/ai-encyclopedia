# Proposal: Causal Machine Learning (ml/18)

**Track:** `ml` · **Level:** advanced · **Proposed slug:** `ml/18-causal-ml`

---

## Thesis

Every method in Vol I assumes associations: a model learns that X co-occurs with Y and uses
that pattern to predict. Causal ML asks a harder question — what happens to Y if we *do* X?
That shift (from Pearson's correlation to Pearl's do-operator) is the difference between a
recommendation engine and a policy that actually improves outcomes. Conditional Average
Treatment Effect (CATE) estimation, causal discovery, and the Double/Debiased ML framework
are now standard tools in A/B test analysis, personalised medicine, credit risk management,
and regulatory impact assessment. The necessary causal vocabulary (DAGs, backdoor criterion,
d-separation) appears briefly in `stats/03` but no chapter equips readers with the methods.

---

## Proposed sections

1. **The limits of correlation** — Simpson's paradox revisited; when a predictive model gives
   the wrong policy; the potential-outcomes framework (Rubin) vs structural causal models (Pearl)
2. **Causal graphs and identification** — DAGs; d-separation; the backdoor and frontdoor
   criteria; instrumental variables; identifiability vs estimability
3. **Propensity scores and matching** — the propensity score theorem; inverse probability
   weighting; matching estimators; overlap and positivity
4. **CATE estimation with ML** — meta-learners (S-, T-, X-learner); causal forests (Wager &
   Athey 2018); DR-Learner; the bias-variance trade-off unique to heterogeneous effects
5. **Double / Debiased ML** — Chernozhukov et al. (2018) Neyman-orthogonal score; cross-fitting
   as causal sample-splitting; ATE and CATE in high dimensions
6. **Causal discovery** — PC and FCI algorithms; score-based methods (GES); neural causal
   discovery; LiNGAM; when causal discovery is and isn't reliable
7. **Applications** — uplift modelling in marketing and credit; heterogeneous treatment
   effects in clinical trials; causal debugging of production ML models
8. **References**

---

## Primary sources

- Pearl, J. (2000). *Causality: Models, Reasoning and Inference*. Cambridge University Press.
- Imbens, G. W. & Rubin, D. B. (2015). *Causal Inference for Statistics, Social, and Biomedical Sciences*. Cambridge University Press.
- Chernozhukov, V. et al. (2018). "Double/Debiased Machine Learning for Treatment and Structural Parameters." *Econometrics Journal*, 21(1). [arXiv:1608.00060](https://arxiv.org/abs/1608.00060)
- Wager, S. & Athey, S. (2018). "Estimation and Inference of Heterogeneous Treatment Effects using Random Forests." *JASA*, 113(523). [arXiv:1510.04342](https://arxiv.org/abs/1510.04342)
- Kaddour, J. et al. (2022). "Causal Machine Learning: A Survey and Open Problems." [arXiv:2206.15475](https://arxiv.org/abs/2206.15475) — v3 updated May 2026.
- Facure, M. (2022). *Causal Inference for the Brave and True*. (Open-access book.) [arXiv:2403.02467](https://arxiv.org/abs/2403.02467)
- Spirtes, P., Glymour, C. & Scheines, R. (2001). *Causation, Prediction, and Search* (2nd ed.). MIT Press.
- Künzel, S. R. et al. (2019). "Metalearners for Estimating Heterogeneous Treatment Effects using Machine Learning." *PNAS*, 116(10). [arXiv:1706.03461](https://arxiv.org/abs/1706.03461)

---

## Relationship to existing content

- `stats/03` Correlation & Causation §5 "Causal thinking: DAGs, backdoor paths, the do-operator" — brief intro; this chapter is the full treatment
- `ml/14` Ensemble Methods — causal forests extend random forests; cross-reference
- `mlops/05` Stability & Drift §1 "Distribution shift" — covariate shift is the non-causal analogue; distinguish carefully
- `agents/07` RAG — causal reasoning in LLM agents is an emerging research direction; brief note

---

## Why now

The survey "Causal Machine Learning: A Survey and Open Problems" (Kaddour et al.) reached its
third revision in May 2026, reflecting continued community activity. The `Causal-Copilot`
LLM-powered causal analysis agent (arXiv:2504.13263, April 2026) demonstrates practitioners
now expect causal tools to be as accessible as standard ML. CATE estimation is required
reading for ML practitioners in regulated industries (banking, pharma, public policy).

---

## Durability

**HIGH.** Pearl's do-calculus and Rubin's potential-outcomes framework are 30-year-old theory
that has not been superseded; if anything, LLMs are adopting causal vocabulary. Causal forests
and Double ML are production-grade techniques deployed at Amazon, Uber, and in randomised
clinical trials. The gap between "correlation" and "causation" will not close.

---

*Filed by research-scout 2026-06-29. Propose only — do not author the full chapter unprompted.*
