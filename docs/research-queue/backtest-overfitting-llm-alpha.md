# Proposal stub: Backtest Overfitting & LLM-Driven Alpha Discovery (quant/10)

Status: proposal, awaiting human go-ahead. Not a chapter.

## Thesis
A backtest is a hypothesis test that gets run many times, and the number of runs is usually not reported. LLM agents that generate, test and refine alpha factors in a loop make the number of trials far larger and harder to see. The field has answered with sealed evaluators, walk-forward splits, complexity limits and process audits. The underlying statistics (selection bias under multiple testing, the deflated Sharpe ratio, probability of backtest overfitting) are a decade old and will hold up. `content.json` covers time-series walk-forward validation (timeseries/06) and VaR backtesting (quant/06). It has nothing on overfitting in strategy research, the factor zoo, or automated alpha search.

## Proposed outline
1. Why a backtest is a multiple-testing problem: trials, selection bias, the factor zoo
2. Corrections: Harvey–Liu–Zhu t-stat hurdles, deflated Sharpe ratio, probability of backtest overfitting (CSCV)
3. Leakage: look-ahead, survivorship, and LLM pre-training contamination ("profit mirage")
4. LLM-driven alpha mining: generate → backtest → refine loops (AlphaAgent, QuantaAlpha, Chain-of-Alpha, LLM+MCTS)
5. Guardrails that work: sealed evaluator and fixed success definition, causal walk-forward, complexity and redundancy limits, required economic rationale
6. Evaluating the evaluators: process-level audits (ALPHAQT-BENCH), sequestered-period benchmarks (Quant-Arena)
7. Links: stats/04 (multiple comparisons), timeseries/06 (walk-forward), proposals #33 (portfolio optimization) and #30 (market making)

## Key references
Foundations (peer-reviewed, durable):
- Bailey, Borwein, López de Prado, Zhu, "The Probability of Backtest Overfitting", Journal of Computational Finance (2017); SSRN 2326253
- Bailey & López de Prado, "The Deflated Sharpe Ratio", Journal of Portfolio Management 40(5), 2014
- Harvey, Liu, Zhu, "...and the Cross-Section of Expected Returns", Review of Financial Studies 29(1), 2016

Recent (preprints; verify before citing):
- AlphaAgent: LLM-Driven Alpha Mining with Regularized Exploration to Counteract Alpha Decay — arXiv 2502.16789 (KDD 2025)
- Chain-of-Alpha — arXiv 2508.06312
- QuantaAlpha: An Evolutionary Framework for LLM-Driven Alpha Mining — arXiv 2602.07085
- Agentic factor investing pipeline with out-of-sample and economic-rationale gates — arXiv 2603.14288
- AQuA: bounded, sealed-sandbox research loop — arXiv 2608.12841
- ALPHAQT-BENCH, process-level safety audit — ACL 2026 Findings (aclanthology 2026.findings-acl.138)
- CosmosAlpha: Multi-Relational Graph Search for LLM-Driven Alpha Mining — arXiv 2611.04555
- "Hard to Fool: A Bounded LLM Research Loop for Quantitative Finance" — arXiv 2611.06607 (seen only in a listing; title/ID unconfirmed)
