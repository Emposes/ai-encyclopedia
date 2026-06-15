# Proposal: LLM Evaluation & Benchmark Methodology

**Track:** chapters (Vol II – AI Systems)  
**Level:** core  
**Part:** AI Systems  
**Slug:** chapters/17-llm-evaluation  
**Proposed:** 2026-06-15  
**Scout run:** research-scout weekly  

---

## Thesis

"Our model achieves state-of-the-art on MMLU" is now nearly meaningless. Benchmark contamination, saturation, distribution shift between benchmark and deployment, and the proliferation of mutually incomparable scores have made LLM evaluation a discipline in itself. Getting evaluation right — choosing benchmarks, building eval harnesses, designing LLM-as-judge pipelines, avoiding contamination, and interpreting leaderboards honestly — is a first-order skill for practitioners. The encyclopedia covers eval for prompts (prompting/07) and agent evals (agents/06) but has no chapter on the underlying methodology of LLM evaluation. 

---

## Why this gap matters

Every chapter in Vol II references model capability ("frontier models can...", "evaluated on...") without giving readers the tools to assess those claims. Practitioners building fine-tunes (openmodels/03) or deploying agents (agents/05-06) need to know how to construct held-out evaluation sets, run them without data contamination, aggregate scores, and compare systems fairly. This chapter is the missing methodological foundation for all of the above.

---

## Proposed section outline

1. **Why evaluation is hard** — the moving target; benchmark saturation (MMLU now above human baseline); overfitting to benchmarks  
2. **Taxonomy of evals** — multiple-choice vs open-ended; reference-based vs reference-free; automated vs human; static vs live  
3. **Benchmark contamination** — what it is; detection methods (min-k% probability, membership inference); why "decontamination" reports are often insufficient  
4. **LLM-as-judge** — the design space (single vs pairwise; position bias; verbosity bias; self-preference); calibration against human labels; JudgeBench  
5. **Evaluation harnesses** — lm-evaluation-harness, HELM, MTEB; prompting sensitivity; normalisation choices that change rankings  
6. **Agentic and interactive evals** — SWE-bench, WebArena, MCP-Atlas, Tool-Decathlon; why scaffold choices confound comparisons  
7. **Building honest eval suites for fine-tunes** — splitting contamination-free; held-out vs held-in; the nested CV analogy  
8. **Interpreting leaderboards** — what a 1-point MMLU lift costs vs a real-world deployment improvement; the alignment tax  
9. **References**

---

## Key primary sources

- Chang et al. (2023). "A Survey on Evaluation of Large Language Models." ACM TIST. arXiv:2307.03109  
- Zheng et al. (2023). "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." NeurIPS 2023. arXiv:2306.05685  
- Gao et al. (2021 / updated 2024). "A Framework for Few-Shot Language Model Evaluation." (lm-eval-harness) Zenodo. https://doi.org/10.5281/zenodo.10256836  
- Shi et al. (2024). "Detecting Pretraining Data from Large Language Models." ICLR 2024. arXiv:2310.16789  
- Liang et al. (2023). "Holistic Evaluation of Language Models." (HELM) TMLR. arXiv:2211.09110  
- Jimenez et al. (2024). "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" ICLR 2024. arXiv:2310.06770  
- "Benchmark Health Index" (2026). "A Systematic Framework for Benchmarking the Benchmarks of LLMs." arXiv:2602.11674  

---

## Durability assessment

**HIGH.** The need to evaluate models carefully will not go away as models improve; if anything, saturation of existing benchmarks makes the methodology more important over time. The section on LLM-as-judge is particularly durable because that pattern is used throughout the stack (prompt eval, agent eval, RLHF reward models). This chapter would be the reference that all other chapters' "References" sections currently lack.

---

## Relationship to existing content

- prompting/07 Evaluation & The Prompt Lab covers eval for prompts specifically; this chapter is the broader methodological foundation it assumes  
- agents/06 Evals, Observability & Cost covers agent eval; §4 "LLM-judged trajectories" should cross-reference this chapter  
- openmodels/03 Fine-Tuning §4 "Evaluation & iteration" currently has no methodological depth; cross-reference here

---

## Guardrails note

Do not author the full chapter without a human go-ahead. This file is the stub to enable the decision.
