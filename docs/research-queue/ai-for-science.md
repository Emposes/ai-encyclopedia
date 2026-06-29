# Proposal: AI for Science — Structure, Discovery & Simulation (multimodal/07)

**Track:** `multimodal` · **Level:** advanced · **Proposed slug:** `multimodal/07-ai-for-science`

---

## Thesis

The models in this encyclopedia predict tokens, pixels, and actions. Applied to the natural
sciences, those same architectures have begun predicting protein structures, crystal lattice
energies, and molecular binding affinities with accuracy that matches or exceeds experiments
costing millions of dollars. AlphaFold2 won the 2024 Nobel Prize in Chemistry. GNoME
discovered 2.2 million crystal structures in a single compute run. IsoDDE (Feb 2026) pushes
structure-activity prediction into drug development pipelines. These are not incremental
improvements to scientific computation — they are architectural shifts in how science is done.
No chapter in the encyclopedia covers scientific machine learning as a domain: the unique data
structures (graphs, 3D geometry, symmetry groups), the evaluation criteria (physical plausibility,
experimental validation), and the models (equivariant networks, diffusion for molecules,
foundation models for biology) that make it distinct from standard ML.

---

## Proposed sections

1. **Why science is a special domain for ML** — structured data vs flat feature matrices;
   physical symmetries (rotation, reflection, permutation) as hard constraints; ground-truth
   evaluation via experiment; the data-scarcity problem in niche scientific domains
2. **Protein structure prediction** — the protein folding problem; deep MSA search;
   AlphaFold2 architecture (Evoformer + structure module); AlphaFold3 extension to complexes
   and small molecules; database coverage; downstream uses in drug discovery and engineering
3. **Equivariant neural networks** — why E(3)-equivariance matters; SchNet, DimeNet, SE(3)-
   Transformers; message-passing on molecular graphs; invariant vs equivariant representations
4. **Generative models for molecules** — SMILES vs graph vs 3D geometry representations;
   diffusion for molecular generation (DiffSBDD, DiffDock); property-conditioned generation;
   the synthesis-accessibility constraint
5. **Materials discovery** — GNoME: GNNs on crystal graph structures at scale; DFT as ground
   truth; active learning loops; 736 synthesised predictions from GNoME
6. **Scientific foundation models** — ESM-3 (protein language model); Galactica; Gemini for
   science; domain-specific pre-training vs fine-tuning; evaluation against benchmarks (CASP,
   Materials Project)
7. **Agentic AI for scientific discovery** — literature review agents; hypothesis generation;
   lab automation loops; AI co-authorship and replication; current limitations and failure modes
8. **References**

---

## Primary sources

- Jumper, J. et al. (2021). "Highly Accurate Protein Structure Prediction with AlphaFold." *Nature*, 596. [doi:10.1038/s41586-021-03819-2](https://doi.org/10.1038/s41586-021-03819-2)
- Evans, R. et al. (2024). "Accurate Structure Prediction of Biomolecular Interactions with AlphaFold 3." *Nature*, 630. [doi:10.1038/s41586-024-07487-w](https://doi.org/10.1038/s41586-024-07487-w)
- Merchant, A. et al. (2023). "Scaling Deep Learning for Materials Discovery." *Nature*, 624. (GNoME) [doi:10.1038/s41586-023-06735-9](https://doi.org/10.1038/s41586-023-06735-9)
- Isomorphic Labs (2026). IsoDDE Technical Report. February 2026.
- Schütt, K. T. et al. (2017). "SchNet: A Continuous-Filter Convolutional Neural Network for Modeling Quantum Interactions." NeurIPS 2017. [arXiv:1706.08566](https://arxiv.org/abs/1706.08566)
- Fuchs, F. B. et al. (2020). "SE(3)-Transformers: 3D Roto-Translation Equivariant Attention Networks." NeurIPS 2020. [arXiv:2006.10503](https://arxiv.org/abs/2006.10503)
- Lin, Z. et al. (2023). "Evolutionary-Scale Prediction of Atomic-Level Protein Structure with a Language Model." *Science*, 379(6637). (ESM-2)
- Hayes, T. et al. (2024). "Simulating 500 Million Years of Evolution with a Language Model." *Science*. (ESM-3)
- Corso, G. et al. (2023). "DiffDock: Diffusion Steps, Twists, and Turns for Molecular Docking." ICLR 2023. [arXiv:2210.01776](https://arxiv.org/abs/2210.01776)
- Romero, S. R. & Wang, S. (2025). "Agentic AI for Scientific Discovery: A Survey of Progress, Challenges, and Future Directions." [arXiv:2503.08979](https://arxiv.org/abs/2503.08979)

---

## Relationship to existing content

- `multimodal/02` Multimodal LLMs §2 "Tokenizing images" — molecular graphs and atomic
  coordinates as alternative modalities; brief connection
- `multimodal/05` World Models §3 "JEPA" — joint-embedding predictive architectures have a
  parallel in protein language models; cross-reference the latent structure idea
- `multimodal/06` Embodied AI §1 — physical simulation and sim-to-real connects to molecular
  dynamics simulation; note in passing
- `agents/05` Loop Engineering §6 "Long-horizon patterns" — agentic scientific discovery
  (automated hypothesis → experiment → analysis loops) is an emerging application

---

## Why now

AlphaFold2 (2021) and AlphaFold3 (2024) have already won a Nobel Prize and become standard
infrastructure for structural biology worldwide. Isomorphic Labs published IsoDDE in February
2026. Google DeepMind's GNoME (2023) and the growing field of agentic AI for science
(arXiv:2503.08979, March 2025; arXiv:2508.14111, August 2025) represent a coherent new
paradigm the encyclopedia currently has no chapter for. The arrival of protein language models
(ESM-3, 2024) as general scientific foundation models signals that scientific ML is
consolidating around the same Transformer primitives the rest of the encyclopedia covers.

---

## Durability

**HIGH.** AlphaFold2 is production infrastructure for structural biology; no architecture change
will make it irrelevant (it will be extended, not replaced). Equivariant networks and diffusion
for molecules are a stable method class grounded in physics. GNoME-style materials discovery is
being replicated in climate science and semiconductor materials. The Nobel Prize confirms these
are not trends. The encyclopedia already covers multimodal AI — scientific data is simply
another set of modalities deserving one chapter.

---

*Filed by research-scout 2026-06-29. Propose only — do not author the full chapter unprompted.*
