# Proposal: Retrieval-Augmented Generation (RAG)

**Track:** `agents` (Vol IV — AI Systems)
**Level:** core
**Suggested slug:** `agents/07-retrieval-augmented-generation.html`
**Scouted:** 2026-06-14

---

## Thesis

A language model's parametric knowledge is frozen at training time and bounded by context length at inference time. Retrieval-Augmented Generation solves both problems by coupling the model to an external, live corpus: a retriever fetches relevant chunks, the generator conditions on them. The technique has been standard practice since Lewis et al. (2020), but the engineering surface has grown considerably — dense retrieval, reranking, hybrid search, agentic multi-hop retrieval, and rigorous faithfulness evaluation each deserve explicit treatment. This chapter covers the full production RAG stack.

## Why now

- RAG is the default grounding technique for knowledge-intensive LLM applications. Every practitioner building with agents will encounter it.
- The landscape has matured enough to be encyclopedic: retrieval methods, chunking strategies, and evaluation frameworks are well-understood with reproducible benchmarks.
- A comprehensive survey (arXiv:2506.00054, June 2025) and an agentic RAG survey (arXiv:2501.09136, January 2025) now exist as anchor references.
- `agents/02-context-engineering` discusses retrieval vs. long context in one section; there is **no standalone chapter** in `content.json` covering the retrieval stack itself.

## Proposed section outline

1. **The parametric knowledge problem** — what models know vs. what they can look up; why context size alone is not the answer; the faithfulness / grounding problem
2. **Sparse retrieval: BM25 and TF-IDF** — inverted index basics; lexical matching; when sparse wins
3. **Dense retrieval** — bi-encoders; DPR; fine-tuning embedding models; approximate nearest-neighbor search (FAISS, HNSW)
4. **Chunking and indexing strategy** — chunk size, overlap, semantic splitting; metadata filtering
5. **Reranking** — cross-encoders; Cohere Rerank; late interaction (ColBERT); the reranking trade-off
6. **Hybrid search** — RRF (Reciprocal Rank Fusion); combining BM25 + dense; when each wins
7. **Agentic RAG** — iterative retrieval; query decomposition; multi-hop; Self-RAG; Adaptive-RAG
8. **Evaluating RAG** — RAGAS metrics; faithfulness, answer relevance, context precision/recall; hallucination detection
9. **References**

## Key primary sources

- Lewis et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* arXiv:2005.11401
- Karpukhin et al. (2020). *Dense Passage Retrieval for Open-Domain QA.* arXiv:2004.04906
- Asai et al. (2023). *Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection.* arXiv:2310.11511
- Jeong et al. (2024). *Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity.* arXiv:2403.14403
- Es et al. (2023). *RAGAS: Automated Evaluation of Retrieval Augmented Generation.* arXiv:2309.15217
- Comprehensive RAG Survey (June 2025). arXiv:2506.00054
- Agentic RAG Survey (January 2025). arXiv:2501.09136

## Connections to existing chapters

- Builds on: `agents/02-context-engineering` (retrieval vs. long context choice), `agents/03-tools-and-mcp` (retrieval as a tool), `chapters/03-attention` (cross-attention in fusion architectures)
- Distinct from: `agents/02-context-engineering` (RAG implementation detail vs. system-level context budget decisions)
- Adjacent to: `chapters/11-frontier-2026` (memory-augmented models as a frontier extension)

## What NOT to author yet

Do not write the full chapter. This stub is a proposal. Wait for human go-ahead, then author via the normal `author-wave.workflow.mjs` fleet + build gate.
