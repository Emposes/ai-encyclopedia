# Proposal: Gradient-Routed Capability Isolation (GRAM)

**Track:** `openmodels` · **Level:** advanced · **Target:** expand `openmodels/05-red-teaming.html`
**Kind:** section addition to an existing chapter (not a new chapter)

## Summary

`openmodels/05-red-teaming` covers jailbreaks, attack surfaces, and existing
defenses. It does not cover **post-hoc unlearning and its limits**, or the
newest architectural alternative to it. Anthropic and AE Studio's July 2026
GRAM paper ("Modular Pretraining Enables Access Control") shows that
fine-tuning-based unlearning is reliably reversible with light further
training — a known problem — and proposes routing gradients from
dual-use-labelled data (virology, cybersecurity, nuclear physics, exploit
code) into dedicated auxiliary modules during *pretraining*, so the
capability can be removed by deleting the module rather than by trying to
erase it from shared weights after the fact. It is explicitly preliminary
(tested at 50M-5B parameters, not in a production model) but is a concrete
mechanism against a well-documented weak spot in current safety practice.

## Thesis

Unlearning after the fact does not reliably work: methods that fine-tune a
capability away are frequently reversed by a small amount of further
training on related data (the "Who's Harry Potter" and TOFU literature
established this pattern for both ad hoc and benchmark unlearning). GRAM
sidesteps the problem by making the isolation a pretraining-time, structural
property — capability-specific data updates only the auxiliary module tagged
for that data label — so removing the module removes the capability with the
same reliability as never having trained on that data at all, without
retraining a whole second model per restricted capability.

## Proposed section outline (insert as new §N in `openmodels/05-red-teaming`)

1. Why post-hoc unlearning is fragile — the reversibility problem, illustrated with fictitious-author (TOFU) and named-entity ("Who's Harry Potter") unlearning results
2. Gradient-Routed Auxiliary Modules — routing dual-use-labelled training data into dedicated MLP sub-modules by data category, rather than by a learned router
3. Ablation as removal — deleting a module at inference time vs. fine-tuning a capability away; why the former is closer to "never trained on it"
4. Honest limits — preliminary scale (50M-5B params), not yet validated on a frontier model, and the open question of data-labelling coverage for genuinely dual-use content

## Primary sources

| Paper | Link |
|---|---|
| Eldan & Russinovich (2023) — Who's Harry Potter? Approximate Unlearning in LLMs | [arXiv:2310.02238](https://arxiv.org/abs/2310.02238) |
| Maini et al. (2024) — TOFU: A Task of Fictitious Unlearning for LLMs | [arXiv:2401.06121](https://arxiv.org/abs/2401.06121) |
| Anthropic & AE Studio (2026) — Modular Pretraining Enables Access Control (GRAM) | [arXiv:2607.08077](https://arxiv.org/abs/2607.08077) |

## Relationship to existing content

- `openmodels/05-red-teaming` — direct target; sits alongside jailbreak/attack coverage as a defense-side technique
- `chapters/13-mechanistic-interpretability` — feature steering and GRAM are both "control model behavior via structure, not just data" techniques; worth a one-line cross-reference
- Issue #21 (proposed AI Safety & Scalable Oversight chapter, still open) — GRAM is a concrete instance of the "AI control" theme that proposal already scopes; if #21 is ever authored, this section should cross-reference it rather than duplicate the framing

## Durability

**MEDIUM-HIGH.** The reversibility-of-unlearning problem itself is
well-established (2023-2024 literature, independently reproduced). GRAM is
one week old and explicitly preliminary — a single paper, small-scale
experiments, not yet used in a shipped model. Recommend citing it as "a
promising early result" rather than a settled technique, and revisiting in a
future scout cycle once it accumulates independent replication or scale-up
evidence.

---

*Filed by research-scout · 2026-07-20. Propose only — do not edit the shipped chapter unprompted.*
