# Proposal: Graph Neural Networks

**Track:** ml  
**Level:** core  
**Part:** Classical ML  
**Slug:** ml/16-graph-neural-networks  
**Proposed:** 2026-06-15  
**Scout run:** research-scout weekly  

---

## Thesis

Most ML algorithms assume rows of a data matrix are independent and identically distributed. Many real problems are inherently relational: atoms in a molecule share bonds, securities in a portfolio share correlation edges, users in a social network share connection edges. Graph Neural Networks are the canonical family of techniques for learning on such non-Euclidean, graph-structured data via *message passing* — iteratively aggregating neighbourhood information into node representations. They are now standard in drug discovery, fraud detection, recommendation systems, and financial network analysis.

---

## Why this gap matters

The encyclopedia covers every major ML building block (linear models, trees, SVMs, CNNs, RNNs, Transformers) but has no chapter on GNNs, despite GNNs being widely used in tabular + relational settings that the quant and MLOps tracks serve. The omission creates a dead end when a reader moves from the clustering or matrix-factorisation chapters to relational ML.

---

## Proposed section outline

1. **Graphs as a data structure** — nodes, edges, adjacency matrix, degree; why a flat feature matrix loses structure  
2. **The message-passing framework** — aggregate, combine, update; the GNN as a recursive neighbourhood encoder  
3. **Graph Convolutional Networks (GCN)** — Kipf & Welling spectral convolution simplified to a symmetric normalised propagation rule  
4. **Graph Attention Networks (GAT)** — learning edge weights via multi-head attention; when attention beats uniform aggregation  
5. **GraphSAGE** — inductive setting, mini-batch training on large graphs, neighbourhood sampling  
6. **Expressiveness & the WL Test** — why 1-WL bounds GNN power; higher-order GNNs and geometric GNNs  
7. **Applications** — molecule property prediction; portfolio / correlation graphs in quant; knowledge graphs; fraud detection  
8. **References**

---

## Key primary sources

- Kipf & Welling (2017). "Semi-Supervised Classification with Graph Convolutional Networks." ICLR 2017. arXiv:1609.02907  
- Velickovic et al. (2018). "Graph Attention Networks." ICLR 2018. arXiv:1710.10903  
- Hamilton, Ying & Leskovec (2017). "Inductive Representation Learning on Large Graphs." NeurIPS 2017. arXiv:1706.02216  
- Xu et al. (2019). "How Powerful are Graph Neural Networks?" ICLR 2019. arXiv:1810.00826  
- Zhou et al. (2018). "Graph Neural Networks: A Review of Methods and Applications." arXiv:1812.08434  
- Wu et al. (2019). "A Comprehensive Study on Graph Neural Networks." arXiv:1901.00596  
- Jiang et al. (2024). "Dynamic Graph Neural Networks for Enhanced Volatility Prediction in Financial Markets." arXiv:2410.16858  

---

## Durability assessment

**HIGH.** GNNs are a decade-old research area with mature libraries (PyG, DGL), wide production adoption in pharma and fintech, and no sign of displacement. The Transformer did not replace GNNs; many modern architectures combine both (graph transformers). This chapter will not need revision more frequently than the CNN or Ensemble chapters.

---

## Guardrails note

Do not author the full chapter without a human go-ahead. This file is the stub to enable the decision. Full authoring goes through `author-wave.workflow.mjs`.
