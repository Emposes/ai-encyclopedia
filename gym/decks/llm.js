/* ============================================================
   THE GYM — DECK: VOL II THE LLM STACK
   9 MCQ · 3 numeric (back-of-envelope, 5% tolerance) · 1 kata
   MCQ options are length-balanced (±25% within each item) and the
   engine shuffles their order at render time — read, don't meta-game.
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.llm = {
  id: "llm",
  vol: "VOL II — THE LLM STACK",
  title: "LLM Stack Drills",
  desc: "Tokenizers to serving: attention scaling, the KV cache, Chinchilla, LoRA, quantization, sampling, MoE — plus the back-of-envelope numerics worth memorizing and a KV-cache kata.",
  items: [

    {
      type: "mcq",
      q: "A model that writes flawless code still insists “strawberry” has two r's. The root cause is most likely:",
      opts: [
        "Sparse training data — the spelling of 'strawberry' appears too rarely in the corpus to be learned reliably",
        "Attention heads provably cannot implement the iterative counting circuits a character tally would require",
        "BPE tokenization — the word arrives as a few opaque token IDs, so letter counts are memorized, not read off",
        "RLHF damage — preference tuning quietly degrades mechanical sub-skills like spelling, counting, and arithmetic"
      ],
      correct: 2,
      exp: "Subword tokenization is lossy compression of the character stream: the model never <em>sees</em> the letters inside a token. The same blind spot explains digit-by-digit arithmetic quirks and rhyming failures. <b>Diagnose at the tokenizer first</b> — fixes are byte/character-level models or just letting the model call a tool that can see characters."
    },

    {
      type: "mcq",
      q: "Why are attention scores divided by \\(\\sqrt{d_k}\\) before the softmax?",
      opts: [
        "It rescales the value vectors to unit norm before the weighted sum, so no single head dominates the residual stream",
        "Unscaled dot products grow with head dimension, saturating the softmax to near one-hot with vanishing gradient",
        "It caps the magnitude of the score matrix so attention logits stay representable in low-precision training formats",
        "It enforces causality by damping the attention paid to distant positions, like a learned soft-decay mask"
      ],
      correct: 1,
      exp: "With unit-variance components, \\(q \\cdot k\\) has variance \\(d_k\\) — at \\(d_k = 128\\) raw scores swing &plusmn;20+, and softmax of such logits is effectively argmax with zero gradient. Dividing by \\(\\sqrt{d_k}\\) restores unit variance, <b>keeping the softmax in its trainable regime</b>. It's the same mathematics as sampling temperature, applied inside the architecture."
    },

    {
      type: "mcq",
      q: "The KV cache exists because during autoregressive decoding:",
      opts: [
        "The model's weights receive small online updates after each emitted token and must be staged in fast memory",
        "Per-step logits must be retained so the repetition and frequency penalties can be reapplied over the whole sequence",
        "Sampling backpropagates gradients through all previous tokens, and the cache keeps those activations resident on-GPU",
        "Each new token's query attends over every previous key and value, which would otherwise be recomputed every step"
      ],
      correct: 3,
      exp: "Without the cache, generating token \\(T\\) means re-running attention projections for all \\(T-1\\) predecessors — \\(O(T^2)\\) recompute per token. Caching K and V makes each step an \\(O(T)\\) lookup. The price: cache size grows <b>linearly with context and batch</b>, and at long contexts it, not the weights, becomes the memory bottleneck — the direct motivation for MQA, GQA and MLA."
    },

    {
      type: "mcq",
      q: "At batch size 1, decoding uses ~5% of a flagship GPU's FLOPs, yet generation can't go faster. Single-stream decode speed is limited by:",
      opts: [
        "Memory bandwidth — every token streams essentially all of the weights plus the KV cache out of HBM",
        "Arithmetic throughput — the attention matmuls saturate the tensor cores even at batch size one",
        "Host overhead — the Python serving loop plus per-kernel launch latency dominate each decode step",
        "Interconnect latency — each sampled token ID must round-trip across the PCIe link between GPU and host CPU"
      ],
      correct: 0,
      exp: "Decode does ~2 FLOPs per weight byte loaded — far below the hundreds-to-one compute-to-bandwidth ratio modern GPUs are built for. So the ceiling is <b>bandwidth &divide; bytes-moved-per-token</b>, not FLOPs. This one fact explains the serving playbook: batch many requests to reuse each weight load, quantize to shrink the bytes, and speculative-decode to amortize them."
    },

    {
      type: "mcq",
      q: "Chinchilla's core finding for compute-optimal pretraining was:",
      opts: [
        "Loss is governed almost entirely by parameter count; the size of the training set contributes only a second-order effect",
        "Exactly one epoch over the corpus is optimal; repeating any data, even once, measurably degrades the loss",
        "Scale parameters and tokens together — roughly 20 tokens per parameter — so GPT-3-era models were badly undertrained",
        "Past roughly 100B parameters, adding training data starts to hurt by pushing the model toward rote memorization"
      ],
      correct: 2,
      exp: "Under the budget \\(C \\approx 6ND\\), the loss-minimizing allocation scales \\(N\\) and \\(D\\) in equal proportion — Chinchilla (70B/1.4T) beat Gopher (280B/300B) using the same compute. The modern twist: production models train far <em>past</em> 20:1 deliberately, because <b>inference cost depends only on N</b> — overspending training compute to buy a smaller, cheaper-to-serve model is good business."
    },

    {
      type: "mcq",
      q: "LoRA fine-tunes a model by:",
      opts: [
        "Updating every weight, but with a learning rate small enough to keep the model inside the pretrained loss basin",
        "Freezing the base weights and learning a low-rank update BA — very few trainable params, mergeable afterward",
        "Quantizing the base model and training only its per-channel quantization scales and zero-points on task data",
        "Distilling the base model into a smaller student network that is cheap enough to fine-tune fully end to end"
      ],
      correct: 1,
      exp: "The bet — empirically solid — is that task adaptation lives in a <b>low-dimensional subspace</b> of weight space, so a \\(d \\times d\\) update can be factored as \\(d \\times r\\) times \\(r \\times d\\) with \\(r\\) of 8–64. Train ~0.1–1% of parameters, store a few-MB adapter per task, merge for zero-latency serving. QLoRA stacks this on a 4-bit frozen base, putting 70B fine-tuning on a single GPU."
    },

    {
      type: "mcq",
      q: "Serving a 70B model in INT4 instead of FP16 chiefly buys you:",
      opts: [
        "Higher accuracy — the rounding noise acts as a regularizer that smooths out overfit weight noise at inference time",
        "Cheaper training — the backward pass now runs in four-bit arithmetic, saving the overwhelming bulk of the FLOPs",
        "Free context length — KV-cache entries get quantized along with the weights, so longer prompts cost no extra memory",
        "~4× less weight memory — and since decode is bandwidth-bound, a roughly proportional speedup in token generation"
      ],
      correct: 3,
      exp: "Weight-only quantization shrinks the bytes streamed per token, which is exactly the decode bottleneck — so the speedup tracks the compression. The catch: a handful of channels carry outsized activations, and naive uniform quantization butchers them; GPTQ/AWQ-class methods exist to protect exactly those. <b>Quality degrades gently to ~4-bit, then falls off a cliff</b> — and smaller models hit the cliff sooner."
    },

    {
      type: "mcq",
      q: "Temperature 0.7 versus top-p 0.9 — what does temperature actually do?",
      opts: [
        "It divides the logits by T before the softmax, sharpening or flattening the whole next-token distribution",
        "It truncates the vocabulary to the smallest set of top tokens holding 70% of the probability mass",
        "It seeds the sampler's random number generator, so two runs at equal temperature reproduce identical outputs",
        "It penalizes tokens that have already appeared, scaling the down-weight by each token's running repeat count"
      ],
      correct: 0,
      exp: "Two different levers: temperature <b>reshapes</b> probabilities (\\(T \\to 0\\) approaches greedy, \\(T &gt; 1\\) flattens toward uniform); top-p <b>cuts</b> the distribution where cumulative mass passes 0.9, adapting the cutoff to confidence — wide when the model is unsure, narrow when it's certain. They compose (temperature first), which is why tuning both simultaneously without a plan produces confusing results."
    },

    {
      type: "mcq",
      q: "A Mixtral-style MoE has 8 expert FFNs per layer with 2 active: ~47B total parameters but per-token compute comparable to a ~13B dense model. Why?",
      opts: [
        "Six of the eight experts get pruned away after training, leaving a 13B-equivalent dense model to serve",
        "A router activates only 2 of 8 expert FFNs per token — active params set FLOPs, total params set memory",
        "The experts share most of their weights with each other, so the 47B total double-counts identical tensors",
        "Experts are stored quantized and dequantized only on demand, hiding most of the parameter cost in storage"
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
    },

    {
      type: "kata",
      q: "<b>KATA — implement EQ 3.5.</b> Write <code>kv_bytes(L, h_kv, d_k, T, b, bytes_per)</code> — the KV-cache size in bytes from Vol II, EQ 3.5: \\(2 \\cdot L \\cdot h_{kv} \\cdot d_k \\cdot T \\cdot b \\cdot \\text{bytes/elem}\\) (the 2 is K and V). The tests check the Llama-3-70B numbers from the chapter's worked example.",
      starter: [
        "def kv_bytes(L, h_kv, d_k, T, b, bytes_per):",
        "    # Vol II EQ 3.5 — KV-cache size in bytes:",
        "    # 2 (K and V) x layers x KV heads x head dim x tokens x batch x bytes/elem",
        "    ..."
      ].join("\n"),
      tests: [
        "v = kv_bytes(80, 8, 128, 1, 1, 2)",
        "assert v == 327680, \"Llama-3-70B, one token: expected 327,680 B (320 KB), got %r\" % (v,)",
        "v = kv_bytes(80, 8, 128, 8192, 1, 2)",
        "assert v == 2684354560, \"Llama-3-70B at 8K context: expected 2.5 GiB in bytes, got %r\" % (v,)",
        "assert kv_bytes(80, 64, 128, 8192, 1, 2) == 8 * kv_bytes(80, 8, 128, 8192, 1, 2), \"full MHA (64 KV heads) must cost exactly 8x GQA-8\"",
        "assert kv_bytes(32, 8, 128, 8192, 1, 2) == 2**30, \"the numeric drill's model: exactly 1 GiB\"",
        "assert kv_bytes(80, 8, 128, 8192, 16, 2) == 16 * kv_bytes(80, 8, 128, 8192, 1, 2), \"cache must scale linearly with batch size\"",
        "print(\"ALL TESTS PASSED\")"
      ].join("\n"),
      solution: [
        "def kv_bytes(L, h_kv, d_k, T, b, bytes_per):",
        "    return 2 * L * h_kv * d_k * T * b * bytes_per"
      ].join("\n"),
      exp: "One multiplication chain: <code>2 * L * h_kv * d_k * T * b * bytes_per</code>. The value is in having <em>internalized</em> it: Llama-3-70B costs 320 KB of cache per token, 2.5 GiB per 8K user, and full MHA would 8&times; all of it — which is the entire argument for GQA, read straight off the formula. <b>Every serving capacity question starts with this function.</b>"
    }
  ]
};
