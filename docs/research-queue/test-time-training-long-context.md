# Proposal: Test-Time Training for Long Context (TTT-E2E)

**Track:** `chapters` · **Level:** advanced · **Target:** expand `chapters/08-inference.html`
(new subsection, not a new chapter)

## Summary

`chapters/08-inference` covers three answers to the cost of serving long contexts with a
standard Transformer: PagedAttention (§8.3, manage the KV cache better), continuous batching
(§8.4, keep the GPU busy), and speculative decoding (§8.5, spend less compute per token). All
three keep the KV cache as the object being optimized. TTT-E2E proposes a structurally
different answer: don't cache the context at all — compress it into the model's weights via
gradient updates performed *at inference time*, then discard it. That reframes long-context
serving as a continual-learning problem instead of a memory-management problem, which is a
genuinely new axis for the chapter, not a variant of the existing three.

## Thesis

A standard Transformer with sliding-window attention continues learning at test time: it runs
next-token prediction on the incoming context and takes gradient steps against its own weights
as it reads, so the context is absorbed into the parameters rather than held in an
ever-growing KV cache. Inference cost then depends on the (fixed) window size, not on how much
context has been read — the paper reports constant per-token latency regardless of context
length, and a 35x inference speedup over full attention at 2M tokens while matching accuracy;
at 128K tokens, 2.7x faster than full attention on H100. In scaling-law terms, at 3B
parameters / 164B training tokens, TTT-E2E's loss scales with context length the way a
full-attention Transformer's does — a property the paper reports that Mamba-2 and Gated
DeltaNet do not share, i.e. it does not trade away long-context quality for the speedup, unlike
some sub-quadratic architectures.

**Caveat to carry into the writeup:** the paper is from December 2025 (arXiv:2512.23675) — not
a from-this-week result — and is not yet independently replicated outside the author group
(Stanford / NVIDIA / UC Berkeley / UC San Diego / Astera Institute). It is being flagged now
because it has kept gathering attention months after publication (recent VentureBeat coverage)
and a working code release exists, not because it is brand new. The authorship includes Yu Sun
(co-author of the original 2024 test-time-training line of work) and several established
Stanford ML researchers (Leskovec, Koyejo, Hashimoto, Guestrin), which raises the credibility
floor, but "no independent replication yet" should be stated plainly in the chapter, the same
way §5's honest-limits framing already treats young results elsewhere in the manual.

## Proposed section (insert as new §8.7, before "Further reading", renumbering that to §8.8)

1. **Caching vs. absorbing context** — restate the KV-cache cost model from §8.3, then pose
   the alternative: what if the context didn't need to be stored at all?
2. **Test-time training as continual learning** — the mechanism: next-token prediction against
   the model's own weights on the incoming context, standard Transformer + sliding-window
   attention underneath, no new architecture family.
3. **What it buys: constant-latency long context** — the 35x-at-2M and 2.7x-at-128K results,
   and the scaling-curve match to full attention (contrast with Mamba-2 / Gated DeltaNet not
   matching it — ties back to `dl/08` if/when the SSM proposal, issue #23, ships).
4. **Open questions** — no independent replication yet; unclear how it composes with
   speculative decoding or continuous batching in a production serving stack; a widget
   contrasting "tokens processed vs. wall-clock latency" for KV-cache vs. TTT-E2E would be a
   natural instrument here.

## Primary sources

| Source | Link |
|---|---|
| Tandon, Dalal, Li, Koceja, Rød, Buchanan, Wang, Leskovec, Koyejo, Hashimoto, Guestrin, McCaleb, Choi & Sun (2025). *End-to-End Test-Time Training for Long Context* | [arxiv.org/abs/2512.23675](https://arxiv.org/abs/2512.23675) |
| Official code release (JAX) | [github.com/test-time-training/e2e](https://github.com/test-time-training/e2e) |
| Project page / PDF | [test-time-training.github.io/e2e.pdf](https://test-time-training.github.io/e2e.pdf) |
| HuggingFace paper page (community discussion) | [huggingface.co/papers/2512.23675](https://huggingface.co/papers/2512.23675) |

## Relationship to existing content

- `chapters/08-inference` §8.3–§8.5 — direct target; this is a fourth, structurally distinct
  answer to long-context serving cost, alongside cache management, batching, and speculative
  decoding.
- Issue #23 (State Space Models & Hybrid Architectures, `dl/08`, still open) — both are
  sub-quadratic alternatives to full attention; cross-reference once both exist. TTT-E2E keeps
  a standard Transformer body (no new recurrence family), which is the key distinction worth
  stating explicitly so readers don't conflate the two approaches.
- `chapters/03-attention` — the O(n²) cost both this and §8.3–8.5 are working around.

## Durability

**MEDIUM.** The mechanism is simple and well-motivated (it is standard next-token training,
just run online at inference time), the code is public, and the authorship includes credible,
established researchers. But it is eight months old with no independent replication found in
this sweep, and "test-time training" as a line of work has had narrower/vision-specific results
before (ViTTT, Spatial-TTT) that did not generalize as strongly as claimed. Recommend writing
the section with the replication caveat up front, the same posture taken in issue #27 for the
Jacobian-lens proposal. Revisit if an independent group reproduces the scaling-curve claim, or
if a frontier lab ships a production model using this technique.

---

*Filed by research-scout 2026-08-10. Do not author the full section unprompted — this is a
proposal for human review.*
