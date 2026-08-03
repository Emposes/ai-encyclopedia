# Proposal: Global Workspace / Jacobian-Lens Interpretability

**Track:** `chapters` · **Level:** advanced · **Target:** expand
`chapters/13-mechanistic-interpretability.html` (section addition, not a new
chapter)

## Summary

`chapters/13-mechanistic-interpretability` covers superposition, sparse
autoencoders, and circuits/causal methods (§5), but has no coverage of
Jacobian-based causal tracing or of the specific finding that a small,
privileged subspace of a model's activations behaves like a bottleneck for
the concepts it can report on and act on. Anthropic's July 2026 paper
introduces both a new instrument (the Jacobian lens) and a concrete,
partially-replicated empirical claim (a "global workspace" subspace) that
sits naturally alongside the existing circuits material in §5.

## Thesis

The Jacobian lens (J-lens) reads the *directional* influence of an
intermediate activation on final-token likelihood: linearize the
activation-to-logit map and average the resulting Jacobian across positions
and prompts, rather than looking for exact zero/nonzero activations
(sparse-autoencoder-style) or ablating components one at a time
(circuit-style). Applied to Claude, it surfaces a small subspace — on the
order of two dozen concurrently active concepts, well under 10% of
activation variance, concentrated in the middle layers — that the model
appears to use for the reasoning it can verbalize and control, sitting on
top of a much larger volume of activation that never surfaces in that way.
Anthropic frames this against Global Workspace Theory from cognitive
science; that framing (and any inference toward "consciousness") is
contested and should be treated as interpretive gloss, not as part of the
technical claim.

An independent open replication (Qwen 3.6 27B, non-Anthropic model and
non-Anthropic team) reproduced the core phenomenon and one of the causal
edits (multi-fact editing) cleanly, but could not reproduce two of the
original paper's sub-experiments (rhyme-planning, mental-arithmetic) and
found the multi-hop probe-swap effect weak — i.e., the central finding
generalizes beyond the original model, but not every claimed sub-result
does. That mixed-but-real replication is what moves this from "single-lab
result, wait" (the assessment research-scout gave it on 2026-07-20 and
2026-07-27) to "worth writing up, with the caveats stated plainly."

## Proposed section outline (insert as new subsection in existing §5,
"Circuits, motifs & causal methods")

1. **The Jacobian lens as a causal instrument** — how it differs from SAE
   dictionary learning (§4) and from ablation-based circuit tracing (rest of
   §5): it is a linearization of the activation→output map, not a learned
   dictionary or an intervention.
2. **The J-space finding** — a small, mid-layer subspace that concentrates
   the concepts a model can verbalize and steer; what "verbalizable" means
   operationally (the paper's own definition, not a philosophical claim).
3. **The Global Workspace Theory framing, held at arm's length** — state
   Anthropic's own framing, then flag explicitly that (a) whether "global
   workspace" is the right label is disputed among the cognitive-science
   researchers who originated the theory, and (b) this is evidence about an
   information-routing bottleneck, not evidence for or against machine
   consciousness. Match the chapter's existing "honest limits" voice (§6).
4. **Independent replication status** — what reproduced (core subspace
   phenomenon, multi-fact editing, on a different open-weight model) and
   what didn't (rhyme-planning, mental-arithmetic, weak multi-hop effect).
   This is the paragraph that keeps the section honest.

## Primary sources

| Source | Link |
|---|---|
| Gurnee, Sofroniew et al. (Anthropic, Jul 6 2026) — Verbalizable Representations Form a Global Workspace in Language Models | [transformer-circuits.pub/2026/workspace](https://transformer-circuits.pub/2026/workspace/index.html) |
| Anthropic — Jacobian-lens code release (Apache-2.0) | [github.com/anthropics/jacobian-lens](https://github.com/anthropics/jacobian-lens) |
| Neuronpedia — interactive J-lens demo | [neuronpedia.org/jlens](https://neuronpedia.org/jlens) |
| Independent replication on Qwen 3.6 27B (mixed results — core phenomenon + multi-fact editing replicated; rhyme-planning, mental-arithmetic, and multi-hop probe-swap did not replicate cleanly) | [github.com/tao-hpu/jspace-replication](https://github.com/tao-hpu/jspace-replication) |
| Neel Nanda (DeepMind) — external review of the replication | [lesswrong.com/posts/zFJ3ZdQwrTWE9jT5S](https://www.lesswrong.com/posts/zFJ3ZdQwrTWE9jT5S/a-review-of-anthropic-s-global-workspace-paper) |

## Relationship to existing content

- `chapters/13-mechanistic-interpretability` §4 (sparse autoencoders) and §5
  (circuits & causal methods) — direct target; J-lens is a third family of
  method alongside dictionary learning and ablation, worth a one-line
  taxonomy sentence tying the three together.
- §6 ("Feature steering, and honest limits") — the replication-status
  paragraph belongs in the same honest, non-hype register already
  established there.

## Durability

**MEDIUM.** The underlying instrument (Jacobian-based linearization) is
methodologically unremarkable and well-grounded; the empirical claim (a
small mid-layer subspace gating verbalizable/controllable behavior) has now
cleared the single-lab bar via an independent, non-Anthropic replication —
though that replication is explicitly mixed, not a clean confirmation.
Recommend writing the section with the replication caveats front and center
rather than leading with the "global workspace"/consciousness framing that
generated most of the press coverage. Revisit if further replications
narrow (or widen) the gap between what reproduced and what didn't.

---
*Filed by research-scout 2026-08-03. Do not edit the shipped chapter
unprompted — this is a proposal for human review.*
