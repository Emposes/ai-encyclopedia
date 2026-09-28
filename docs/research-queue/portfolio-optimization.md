# Proposal stub: Portfolio Optimization & Asset Allocation (quant/09)

**Status:** proposed, not authored. Tracked in GitHub issue (research + proposal label).
**Source:** weekly research-scout sweep, 2026-09-28. Digest: `docs/research-digest/2026-09-28.md`.

## Coverage check

Grepped `quant/*.html`, `ml/*.html`, `chapters/*.html`, `mlops/*.html` for
"markowitz", "efficient frontier", "mean-variance", "black-litterman"
(case-insensitive): zero hits anywhere in the encyclopedia. `quant/06-risk-measurement.html`
covers portfolio VaR/CVaR as a risk *measurement* problem but never portfolio
*construction* — no chapter teaches how weights are actually chosen. This is a genuine
gap in a 6-chapter quant track, not a duplicate of any of the 18 currently open
`research`+`proposal` issues (#12–#32) or of the existing chapters.

## Why now

Two threads converge:

1. **The classical baseline is entirely absent.** Markowitz mean-variance (1952) and
   Black-Litterman (1992) are the two most-cited results in all of quantitative finance
   and the encyclopedia has no chapter on either.
2. **A live 2025–2026 research wave is replacing the classical two-stage
   "predict returns, then optimize" pipeline with end-to-end differentiable
   optimization** that backpropagates directly through a Sharpe/CVaR/Omega objective:
   - Zhang, Zohren & Roberts, *A Universal End-to-End Approach to Portfolio Optimization
     via Deep Learning* ([arXiv:2111.09170](https://arxiv.org/abs/2111.09170)) — the
     foundational reframing: skip return forecasting, learn weights directly.
   - *DeePM: Regime-Robust Deep Learning for Systematic Macro Portfolio Management*
     ([arXiv:2601.05975](https://arxiv.org/abs/2601.05975), Jan 2026) — a
     window-robust objective via differentiable soft-min over rolling-window Sharpe.
   - *Deep Learning for Financial Time Series: A Large-Scale Benchmark of Risk-Adjusted
     Performance* ([arXiv:2603.01820](https://arxiv.org/abs/2603.01820), Mar 2026).
   - Park, *Joint Return and Risk Modeling with Deep Neural Networks for Portfolio
     Construction* ([arXiv:2603.19288](https://arxiv.org/abs/2603.19288), Mar 2026).
   - *Financially Guided Deep Portfolio Optimization*
     ([arXiv:2605.28853](https://arxiv.org/abs/2605.28853), May 2026) — differentiable
     surrogates for Sharpe, Omega, CVaR and Risk Parity, benchmarked against the S&P 500.
   - *Decision-focused Sparse Tangent Portfolio Optimization*
     ([arXiv:2607.00581](https://pith.science/paper/2607.00581), Jul 2026) — end-to-end
     differentiable pipeline for sparse tangent portfolios.

Five independent groups across seven months converging on "optimize the trading
objective directly, don't forecast-then-optimize" is the same durability signal that
justified the vol-surfaces proposal (#32): a coherent arc, not one team's demo.

## What this is NOT

- Not a replacement for `quant/06-risk-measurement.html` — that chapter measures risk
  in an existing portfolio; this one is about choosing the weights in the first place.
- Not a duplicate of #30 (Market Making & LOB Modeling with RL) — that is
  microstructure/execution; this is allocation across a fixed universe of assets.
- Not a "deep learning beats mean-variance" hit piece — the classical framework is the
  chapter's spine and the honest baseline the modern methods are benchmarked against.

## Suggested thesis

Portfolio construction is a two-stage bet — forecast, then optimize — until it isn't:
Markowitz turned "diversify" into a solvable quadratic program, and Black-Litterman
fixed its worst practical failure mode (corner solutions from noisy return estimates)
by blending market equilibrium with investor views. The 2020s deep-learning wave
breaks the two-stage assumption itself, backpropagating through the objective
(Sharpe, CVaR, Omega) so the network's only job is to output good weights — accepting
a harder-to-interpret model in exchange for not compounding two separate estimation
errors.

## Suggested section outline

1. The allocation problem: return, risk, and the shape of a good portfolio
2. Markowitz mean-variance optimization & the efficient frontier
3. Why naive mean-variance breaks in practice (estimation error, corner solutions)
4. Black-Litterman: blending equilibrium returns with investor views
5. The two-stage critique: predict-then-optimize compounds forecasting error
6. End-to-end differentiable portfolio optimization (Sharpe/CVaR/Omega as the loss)
7. Where classical still wins: interpretability, regulatory transparency, data-poor regimes
8. References

## Guardrails

Propose-only. Full chapter authoring goes through `author-wave.workflow.mjs` + the
build gate after human go-ahead, per `AUTHORING.md` and `scripts/routines/research-scout.md`.
