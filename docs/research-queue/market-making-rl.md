# Proposal: Market Making & Limit-Order-Book Modeling with RL (quant/07)

**Source:** weekly research-scout sweep, 2026-08-24.

## Why this, why now

The quant track (`quant/01`–`06`) covers stochastic calculus, option pricing,
interest-rate models, Monte Carlo methods, and risk measurement — the classical
derivatives-pricing spine. It has no market-microstructure content at all: no
limit order book, no bid-ask spread dynamics, no market-making or execution
problem. That's a real gap, not a stylistic choice — market making is one of
the oldest applied-RL problems in finance (the Avellaneda-Stoikov
inventory-risk model predates deep RL entirely) and the field has kept moving:

1. **Cheridito & Weiss, "Multi-Level Market Making with Reinforcement
   Learning"** (arXiv:2608.18195, Aug 2026) — a deep-set encoder over
   variable-length order sets plus potential-based reward shaping for
   multi-level LOB market making, from an established stochastic-control
   group (ETH Zurich).
2. A standing academic literature this new paper sits inside: Avellaneda &
   Stoikov (2008) for the closed-form inventory model, Guéant-Lehalle-
   Fernandez-Tapia for the general HJB treatment, and Cartea-Jaimungal-Penalva's
   *Algorithmic and High-Frequency Trading* as the standard text — i.e. this
   isn't a single-paper trend, it's a mature sub-field the encyclopedia
   happens to skip.
3. **Chionas et al., "Concentrated Liquidity Provision: a Reinforcement
   Learning Perspective"** (arXiv:2608.19389, Aug 2026) extends the same
   family of ideas to DeFi automated market makers — a modern variant worth
   a closing section, not a separate chapter.

## What this is NOT

- Not a duplicate of `rl/06-rl-and-llms.html` (RL meets LLMs) or any RL-track
  chapter — this is RL applied to a market-microstructure control problem,
  covered nowhere in `rl/` or `quant/`.
- Not competing with any of the 16 currently-open `research`+`proposal`
  issues (#12–#29 as of this sweep) — none touches market microstructure,
  execution, or market making.
- Not a rewrite of `quant/06-risk-measurement.html` — that's portfolio-level
  risk (VaR/ES), this is single-instrument quoting/inventory control.

## Suggested thesis

A market maker posts two-sided quotes and earns the spread, but every fill
changes its inventory and its risk. The classical solution (Avellaneda-
Stoikov) closes the inventory-risk tradeoff analytically under strong
assumptions; RL relaxes those assumptions — variable order-book depth,
adversarial/strategic counterparties, multi-level quoting — at the cost of a
harder, less interpretable policy.

## Suggested section outline

1. The market-making problem: quotes, fills, inventory risk, adverse selection
2. The closed-form baseline: Avellaneda-Stoikov reservation price & optimal spread
3. Why the closed form breaks: multi-level books, non-Poisson arrivals, competition
4. RL formulation: state (inventory, book depth, order flow), action (quote levels), reward shaping
5. Modern architecture note: deep-set/permutation-invariant encoders for variable-length order sets
6. Case study: concentrated liquidity provision as market making in DeFi AMMs
7. References

## Coverage check performed

Grepped `quant/*.html`, `timeseries/*.html`, `rl/*.html`, and `glossary.js`
for "market making", "limit order book", "microstructure", "order book",
"Avellaneda" — zero hits anywhere in the site. Cross-checked against all 16
currently-open `research`+`proposal` issues (#12–#29): none address market
microstructure, execution, or market making.

## Guardrails

Propose-only. Full chapter authoring goes through `author-wave.workflow.mjs`
+ build gate after human go-ahead, per `AUTHORING.md` and
`scripts/routines/research-scout.md`.
