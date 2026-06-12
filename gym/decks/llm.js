/* ============================================================
   THE GYM — DECK: VOL II THE LLM STACK
   9 MCQ · 3 numeric (back-of-envelope, 5% tolerance)
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.llm = {
  id: "llm",
  vol: "VOL II — THE LLM STACK",
  title: "LLM Stack Drills",
  desc: "Tokenizers to serving: attention scaling, the KV cache, Chinchilla, LoRA, quantization, sampling, MoE — plus three back-of-envelope numerics worth memorizing.",
  items: [

    {
      type: "mcq",
      q: "A model that writes flawless code still insists “strawberry” has two r's. The root cause is most likely:",
      opts: [
        "Insufficient training data containing the word strawberry",
        "Attention heads cannot implement counting circuits",
        "The model reads BPE tokens, not characters — “strawberry” arrives as one or two opaque IDs, so letter counts must be memorized rather than read off",
        "RLHF fine-tuning damaged its spelling ability"
      ],
      correct: 2,
      exp: "Subword tokenization is lossy compression of the character stream: the model never <em>sees</em> the letters inside a token. The same blind spot explains digit-by-digit arithmetic quirks and rhyming failures. <b>Diagnose at the tokenizer first</b> — fixes are byte/character-level models or just letting the model call a tool that can see characters."
    },

    {
      type: "mcq",
      q: "Why are attention scores divided by \\(\\sqrt{d_k}\\) before the softmax?",
      opts: [
        "It normalizes the value vectors to unit length",
        "Dot products of \\(d_k\\)-dimensional vectors have variance growing with \\(d_k\\); unscaled, the softmax saturates to near one-hot and gradients through it vanish",
        "It reduces the memory footprint of the score matrix",
        "It enforces causality by damping attention to distant positions"
      ],
      correct: 1,
      exp: "With unit-variance components, \\(q \\cdot k\\) has variance \\(d_k\\) — at \\(d_k = 128\\) raw scores swing &plusmn;20+, and softmax of such logits is effectively argmax with zero gradient. Dividing by \\(\\sqrt{d_k}\\) restores unit variance, <b>keeping the softmax in its trainable regime</b>. It's the same mathematics as sampling temperature, applied inside the architecture."
    },

    {
      type: "mcq",
      q: "The KV cache exists because during autoregressive decoding:",
      opts: [
        "The model's weights are updated after every generated token",
        "Logits from earlier steps must be stored for the repetition penalty",
        "Gradients from the previous tokens must be retained for sampling",
        "Each new token's query attends over all previous keys and values, which would otherwise be recomputed from scratch every single step"
      ],
      correct: 3,
      exp: "Without the cache, generating token \\(T\\) means re-running attention projections for all \\(T-1\\) predecessors — \\(O(T^2)\\) recompute per token. Caching K and V makes each step an \\(O(T)\\) lookup. The price: cache size grows <b>linearly with context and batch</b>, and at long contexts it, not the weights, becomes the memory bottleneck — the direct motivation for MQA, GQA and MLA."
    },

    {
      type: "mcq",
      q: "At batch size 1, decoding uses ~5% of a flagship GPU's FLOPs, yet generation can't go faster. Single-stream decode speed is limited by:",
      opts: [
        "Memory bandwidth — every token requires streaming essentially all weights (plus the KV cache) from HBM into compute units",
        "Arithmetic throughput — matrix multiplies saturate the tensor cores",
        "Python interpreter overhead in the serving loop",
        "Network latency between GPU and CPU"
      ],
      correct: 0,
      exp: "Decode does ~2 FLOPs per weight byte loaded — far below the hundreds-to-one compute-to-bandwidth ratio modern GPUs are built for. So the ceiling is <b>bandwidth &divide; bytes-moved-per-token</b>, not FLOPs. This one fact explains the serving playbook: batch many requests to reuse each weight load, quantize to shrink the bytes, and speculative-decode to amortize them."
    },

    {
      type: "mcq",
      q: "Chinchilla's core finding for compute-optimal pretraining was:",
      opts: [
        "Loss is determined by parameter count alone; data quantity barely matters",
        "Models should be trained on exactly one epoch of the entire internet",
        "For a fixed compute budget, parameters and tokens should scale together — roughly 20 tokens per parameter — meaning GPT-3-era models were substantially undertrained",
        "Past 100B parameters, adding data degrades performance"
      ],
      correct: 2,
      exp: "Under the budget \\(C \\approx 6ND\\), the loss-minimizing allocation scales \\(N\\) and \\(D\\) in equal proportion — Chinchilla (70B/1.4T) beat Gopher (280B/300B) using the same compute. The modern twist: production models train far <em>past</em> 20:1 deliberately, because <b>inference cost depends only on N</b> — overspending training compute to buy a smaller, cheaper-to-serve model is good business."
    },

    {
      type: "mcq",
      q: "LoRA fine-tunes a model by:",
      opts: [
        "Updating all weights with a much smaller learning rate",
        "Freezing the base weights and learning a low-rank update \\(\\Delta W = BA\\) with rank \\(r \\ll d\\) — orders of magnitude fewer trainable parameters, and \\(BA\\) merges into \\(W\\) afterward so inference cost is unchanged",
        "Quantizing the base model and training only the quantization scales",
        "Distilling the model into a smaller student network"
      ],
      correct: 1,
      exp: "The bet — empirically solid — is that task adaptation lives in a <b>low-dimensional subspace</b> of weight space, so a \\(d \\times d\\) update can be factored as \\(d \\times r\\) times \\(r \\times d\\) with \\(r\\) of 8–64. Train ~0.1–1% of parameters, store a few-MB adapter per task, merge for zero-latency serving. QLoRA stacks this on a 4-bit frozen base, putting 70B fine-tuning on a single GPU."
    },

    {
      type: "mcq",
      q: "Serving a 70B model in INT4 instead of FP16 chiefly buys you:",
      opts: [
        "Higher accuracy from the regularizing effect of rounding",
        "Faster training via cheaper backward passes",
        "Longer usable context at no memory cost",
        "~4× less weight memory and — because decode is bandwidth-bound — roughly proportionally faster generation, at some quality cost concentrated in outlier-heavy channels"
      ],
      correct: 3,
      exp: "Weight-only quantization shrinks the bytes streamed per token, which is exactly the decode bottleneck — so the speedup tracks the compression. The catch: a handful of channels carry outsized activations, and naive uniform quantization butchers them; GPTQ/AWQ-class methods exist to protect exactly those. <b>Quality degrades gently to ~4-bit, then falls off a cliff</b> — and smaller models hit the cliff sooner."
    },

    {
      type: "mcq",
      q: "Temperature 0.7 versus top-p 0.9 — what does temperature actually do?",
      opts: [
        "Rescales the logits (divides by \\(T\\)) before the softmax, sharpening or flattening the whole distribution; top-p instead truncates the tail at fixed cumulative mass",
        "Truncates the vocabulary to the 70% most likely tokens",
        "Sets the random seed for reproducible sampling",
        "Penalizes tokens that have already appeared in the output"
      ],
      correct: 0,
      exp: "Two different levers: temperature <b>reshapes</b> probabilities (\\(T \\to 0\\) approaches greedy, \\(T &gt; 1\\) flattens toward uniform); top-p <b>cuts</b> the distribution where cumulative mass passes 0.9, adapting the cutoff to confidence — wide when the model is unsure, narrow when it's certain. They compose (temperature first), which is why tuning both simultaneously without a plan produces confusing results."
    },

    {
      type: "mcq",
      q: "A Mixtral-style MoE has 8 expert FFNs per layer with 2 active: ~47B total parameters but per-token compute comparable to a ~13B dense model. Why?",
      opts: [
        "Six of the eight experts are pruned away at inference time",
        "A router sends each token through only 2 of the 8 expert FFNs, so active parameters — not total — set the FLOPs per token; total parameters still set the memory bill",
        "The experts share most of their weights with each other",
        "Experts are stored quantized and only dequantized on demand"
      ],
      correct: 1,
      exp: "Sparse activation decouples <b>capacity from compute</b>: knowledge spreads across all experts, but each token pays for two. The costs hide elsewhere — every expert must sit in (expensive) memory, the router needs load-balancing losses to avoid expert collapse, and batched serving gets complicated because different tokens want different experts. Nothing is free; it's a different trade, and currently a winning one."
    },

    {
      type: "numeric",
      q: "KV-cache size. A model has \\(L = 32\\) layers, \\(h_{kv} = 8\\) KV heads, head dimension \\(d_k = 128\\), FP16 cache (2 bytes per value). Using \\(\\text{bytes} = 2 \\cdot L \\cdot h_{kv} \\cdot d_k \\cdot T \\cdot \\text{bytes/val}\\), how many GiB does one sequence of \\(T = 8192\\) tokens occupy? (1 GiB = \\(2^{30}\\) bytes; the leading 2 is for K and V.)",
      answer: 1.0,
      tol: 0.05,
      unit: "GiB",
      exp: "\\(2 \\cdot 32 \\cdot 8 \\cdot 128 \\cdot 8192 \\cdot 2 = 2^{30}\\) bytes — <b>exactly 1 GiB per 8K-token stream</b>. Serve 64 concurrent users and the cache alone eats 64 GiB, dwarfing many models' weights. This is GQA's entire reason to exist: with full multi-head attention (say 64 query heads as KV heads), the same sequence would cost 8 GiB."
    },

    {
      type: "numeric",
      q: "Tokens-per-parameter. A 70B-parameter model is pretrained on 15T tokens. Compute the tokens/param ratio.",
      answer: 214.3,
      tol: 0.05,
      unit: "tok/param",
      exp: "\\(15 \\times 10^{12} / 70 \\times 10^{9} \\approx 214\\) — about <b>10.7&times; past the Chinchilla-optimal ~20</b>. That's not a mistake; it's economics. Training compute is paid once, inference forever, and inference cost scales with N alone — so you pour extra tokens into a smaller model and ship the savings. Llama-3's exact recipe."
    },

    {
      type: "numeric",
      q: "Decode speed ceiling. Batch size 1, weight-bound decode: HBM bandwidth 3.35 TB/s, 70B parameters at 4-bit (0.5 bytes/param). Ceiling \\(\\approx\\) bandwidth \\(\\div\\) (bytes/param \\(\\times\\) params). Tokens per second?",
      answer: 95.7,
      tol: 0.05,
      unit: "tok/s",
      exp: "Weights to stream per token: \\(70\\text{B} \\times 0.5 = 35\\) GB. Then \\(3.35 \\times 10^{12} / 3.5 \\times 10^{10} \\approx 96\\) tok/s — a <b>hard physical ceiling</b> no kernel wizardry beats at batch 1. Real systems land lower (KV traffic, attention, launch overheads). The same model at FP16 caps at ~24 tok/s: there's your quantization speedup, derived from first principles."
    }
  ]
};
