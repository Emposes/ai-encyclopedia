/* ============================================================
   LLM FIELD MANUAL — hover glossary
   Scans prose for known terms and attaches definition tooltips.
   Runs after KaTeX (shared.js calls window.__glossaryScan), with
   a timeout fallback if math never loads. Skips math, code,
   headings, links and widget internals.
   ============================================================ */
(function () {
  "use strict";

  var DEFS = {
    "token": "The atomic unit a model reads and writes — an entry in a fixed vocabulary, typically a word piece of ~4 characters of English.",
    "tokenizer": "The fixed, pre-trained mapping between raw text and token IDs. Not learned during model training.",
    "BPE": "Byte-pair encoding — builds a vocabulary by repeatedly merging the most frequent adjacent symbol pair in a corpus.",
    "embedding": "The learned vector (row of the embedding matrix) that gives a token coordinates in d_model-dimensional space.",
    "logits": "The raw, unnormalized scores the network outputs — one real number per vocabulary token, before softmax.",
    "softmax": "Exponentiates and normalizes a score vector into a probability distribution. Temperature rescales scores first.",
    "cross-entropy": "The training loss: the negative log-probability the model assigns to the true next token, averaged over positions.",
    "perplexity": "exp(loss) — the effective number of equally likely tokens the model is choosing among. Lower is better.",
    "autoregressive": "Generating one token at a time, each conditioned on everything before it, via the chain rule of probability.",
    "teacher forcing": "During training, predicting each position from the true prefix rather than the model's own samples — so all positions train in parallel.",
    "in-context learning": "A trained model's ability to pick up a pattern from examples placed in the prompt, without any weight update.",
    "residual stream": "The d_model-wide vector bus flowing through the network; every attention head and MLP reads from it and writes back by addition.",
    "RMSNorm": "Root-mean-square normalization — rescales a vector to unit RMS with a learned gain. LayerNorm minus mean-centering.",
    "LayerNorm": "Normalizes a vector to zero mean and unit variance with learned gain and bias. Largely replaced by RMSNorm in modern LLMs.",
    "SwiGLU": "The modern MLP form: a SiLU-squashed gate multiplied element-wise with an up-projection, then projected back down.",
    "GELU": "Gaussian-error linear unit, z·Φ(z) — the smooth activation used by GPT-2/BERT-era MLPs.",
    "MLP": "The per-position feed-forward sub-layer (expand, nonlinearity, contract). Holds roughly two-thirds of a transformer's parameters.",
    "RoPE": "Rotary position embeddings — encode position by rotating query/key dimension pairs, making attention scores depend only on relative offset.",
    "ALiBi": "Attention with linear biases — skips position vectors and subtracts a per-head distance penalty from attention scores.",
    "attention": "The mechanism that lets each position read information from others: queries match keys, and the resulting weights blend values.",
    "multi-head attention": "Running many attention operations in parallel low-dimensional subspaces, so a token can look at several things at once.",
    "causal mask": "Additive −∞ entries that zero out attention to future positions, keeping a language model from seeing its own labels.",
    "induction head": "An attention head that finds an earlier occurrence of the current pattern and copies what followed it — a core circuit behind in-context learning.",
    "KV cache": "Stored keys and values of all previous positions, kept so each generation step avoids recomputing them. Dominates inference memory.",
    "MQA": "Multi-query attention — all query heads share a single key/value head, shrinking the KV cache by the head count.",
    "GQA": "Grouped-query attention — groups of query heads share key/value heads; the production compromise between MHA quality and MQA memory.",
    "MLA": "Multi-head latent attention (DeepSeek) — caches one small latent vector per position and reconstructs keys/values from it on the fly.",
    "FlashAttention": "An exact attention kernel that never materializes the T×T score matrix, computing softmax tile-by-tile in on-chip SRAM.",
    "sliding-window attention": "Each position attends only to the last w tokens; stacked layers extend effective reach while keeping cost linear.",
    "attention sink": "The first few tokens of a sequence, which softmax uses to park spare probability mass — evicting them destabilizes generation.",
    "scaling laws": "Empirical power laws relating loss to parameters, data, and compute — the basis for deciding how big to build.",
    "Chinchilla": "DeepMind's 2022 result: at fixed compute, scale parameters and tokens together (~20 tokens per parameter), not parameters alone.",
    "AdamW": "The default LLM optimizer: Adam's per-parameter adaptive steps with weight decay applied directly to weights.",
    "warmup": "The initial phase where learning rate ramps linearly from zero, protecting fragile early optimization.",
    "cosine decay": "Learning-rate schedule that falls along a half-cosine from peak to a small floor over the run.",
    "gradient clipping": "Rescaling the global gradient when its norm exceeds a threshold (usually 1.0), preventing destabilizing steps.",
    "BF16": "bfloat16 — 16-bit float with FP32's exponent range. The default training precision since A100-class hardware.",
    "FP8": "8-bit float formats (E4M3/E5M2) used on Hopper/Blackwell GPUs for matmuls in training and serving.",
    "mixed precision": "Computing in low precision (BF16/FP8) while keeping master weights and optimizer state in FP32 for stable accumulation.",
    "data parallelism": "Cloning the model across devices, splitting the batch, and all-reducing gradients each step.",
    "tensor parallelism": "Splitting individual weight matrices across GPUs so each matmul runs jointly — needs fast interconnect per layer.",
    "pipeline parallelism": "Splitting the model by depth into stages and streaming micro-batches through them.",
    "ZeRO": "Sharding optimizer state, gradients, and finally parameters across data-parallel replicas instead of replicating them (FSDP implements stage 3).",
    "FSDP": "Fully-sharded data parallelism — PyTorch's ZeRO-3: parameters are gathered just-in-time per layer and discarded after use.",
    "activation checkpointing": "Storing only sub-layer boundary activations and recomputing the rest during backward — trades ~30% compute for large memory savings.",
    "MFU": "Model FLOPs utilization — the fraction of theoretical peak GPU throughput spent on useful model math. 35–50% is good at scale.",
    "SFT": "Supervised fine-tuning — training on prompt→response demonstrations with loss only on response tokens. Teaches format and instruction-following.",
    "RLHF": "Reinforcement learning from human feedback — optimizing the model against a learned reward model, with a KL leash to a reference policy.",
    "reward model": "A network (usually the LLM with a scalar head) trained on human comparisons to score how good a response is.",
    "Bradley–Terry": "The preference model behind reward training: P(A beats B) = σ(r_A − r_B).",
    "PPO": "Proximal policy optimization — RL with a clipped update that forbids the policy from moving too far per step. The original RLHF workhorse.",
    "KL divergence": "A measure of how far one distribution drifts from another; RLHF penalizes KL from the reference model to prevent reward hacking.",
    "reward hacking": "Exploiting flaws in a proxy reward — verbosity, sycophancy, confident nonsense — instead of genuinely improving.",
    "DPO": "Direct preference optimization — a classification loss on preference pairs that achieves RLHF's objective with no reward model or RL loop.",
    "GRPO": "Group relative policy optimization — samples a group of responses per prompt and uses the group's mean reward as the baseline, deleting PPO's value network.",
    "RLVR": "RL with verifiable rewards — training against checkable signals (tests pass, answer matches) rather than learned reward models. The engine of reasoning models.",
    "chain of thought": "Intermediate reasoning tokens a model emits before its answer — trading test-time compute for accuracy.",
    "constitutional AI": "Anthropic's method: the model critiques and revises outputs against explicit written principles, and an AI judge generates preference labels from them.",
    "RLAIF": "RL from AI feedback — replacing human preference labels with judgments from a (usually stronger) model.",
    "LoRA": "Low-rank adaptation — freeze the weights, learn the update as a thin matrix product BA. Mergeable after training, swappable at serving time.",
    "QLoRA": "Fine-tuning bf16 LoRA adapters on top of a 4-bit (NF4) frozen base — the technique that put 70B fine-tuning on one GPU.",
    "NF4": "NormalFloat-4 — a 4-bit code whose 16 levels sit at Gaussian quantiles, matching where trained weights actually live.",
    "PEFT": "Parameter-efficient fine-tuning — any method that adapts a model while training a small fraction of its weights.",
    "catastrophic forgetting": "Losing general capability while fine-tuning on a narrow task — probed by re-running broad benchmarks after tuning.",
    "distillation": "Training a small student to match a large teacher's output distribution (or its generated outputs) rather than raw data labels.",
    "dark knowledge": "The information in a teacher's relative probabilities over wrong answers — revealed by softening the softmax with temperature.",
    "quantization": "Mapping weights (and activations) onto a small grid of representable values — fewer bits per parameter, faster and smaller models.",
    "GPTQ": "Post-training quantization that rounds one column at a time, using second-order information to push each column's error onto not-yet-quantized ones.",
    "AWQ": "Activation-aware weight quantization — rescales the ~1% of channels that activations say matter most before rounding.",
    "SmoothQuant": "Migrates activation outlier magnitude into weights via per-channel scaling, enabling fast 8-bit weight-and-activation inference.",
    "QAT": "Quantization-aware training — training with fake-quantized weights in the loop so the model learns to live on the grid.",
    "straight-through estimator": "The trick that lets gradients flow through round(): pretend it's the identity inside the clipping range.",
    "2:4 sparsity": "Semi-structured pattern (two zeros per four weights) that NVIDIA tensor cores execute at up to 2× — the one sparsity with hardware support.",
    "prefill": "The first inference phase: processing the whole prompt in one parallel, compute-bound pass. Sets time-to-first-token.",
    "decode": "The second inference phase: emitting one token at a time, reading all weights and KV cache per step. Memory-bandwidth-bound.",
    "TTFT": "Time to first token — dominated by queueing plus prefill compute.",
    "TPOT": "Time per output token during decode — dominated by memory bandwidth and effective batch size.",
    "arithmetic intensity": "FLOPs per byte moved. Below the hardware's critical ratio you're bandwidth-bound; above it, compute-bound.",
    "roofline": "The performance model plotting achievable FLOP/s against arithmetic intensity — a bandwidth slope capped by a compute ceiling.",
    "PagedAttention": "vLLM's virtual-memory scheme for the KV cache: fixed-size blocks allocated on demand through a block table, eliminating fragmentation.",
    "prefix caching": "Reusing the KV blocks of shared prompt prefixes (system prompts, history) across requests instead of re-running prefill.",
    "continuous batching": "Iteration-level scheduling: finished sequences leave the batch immediately and queued ones join mid-flight.",
    "chunked prefill": "Splitting a long prompt into slices interleaved with ongoing decodes so one big request doesn't spike everyone's latency.",
    "speculative decoding": "A small drafter proposes several tokens; the big model verifies them in one parallel pass with a rejection rule that preserves its exact distribution.",
    "temperature": "Divides logits before softmax: below 1 sharpens toward greedy, above 1 flattens toward uniform.",
    "top-p": "Nucleus sampling — keep the smallest set of tokens whose probabilities sum to p, then renormalize.",
    "top-k": "Keep only the k most probable tokens before sampling.",
    "min-p": "Keep tokens whose probability exceeds a fraction of the maximum — adaptive truncation that tolerates high temperatures.",
    "MoE": "Mixture-of-experts — replace each MLP with many parallel experts and a router sending each token to its top-k. Parameters scale; FLOPs don't.",
    "router": "The small learned layer in an MoE block that scores experts for each token and picks the top-k.",
    "load balancing": "Auxiliary pressure (a loss term or bias) keeping MoE experts evenly used, preventing router collapse onto favorites.",
    "expert parallelism": "Spreading MoE experts across GPUs, with all-to-all communication routing tokens to their experts each layer.",
    "YaRN": "RoPE extension that interpolates per-frequency — fast dimensions untouched, slow ones stretched — plus an attention temperature fix.",
    "position interpolation": "Extending context by compressing all RoPE frequencies so the trained range covers a longer window.",
    "ring attention": "Context parallelism: shard the sequence across GPUs and pass KV blocks around a ring so attention covers the full length.",
    "RAG": "Retrieval-augmented generation — fetch relevant documents and place them in the prompt, fixing knowledge gaps without touching weights.",
    "ViT": "Vision transformer — slices an image into patches, projects each to an embedding, and runs a standard transformer over them.",
    "MCP": "Model Context Protocol — an open standard interface through which models discover and call external tools and resources.",
    "ReAct": "The reason-act loop: think, call a tool, observe the result, repeat — now largely internalized by tool-trained models.",
    "SSM": "State-space model — a (linear) recurrence that compresses history into a fixed-size state: O(1) per decode step, no KV cache.",
    "Mamba": "The selective SSM: transition matrices are functions of the input, letting the state gate what to remember — trainable in parallel via scans.",
    "sparse autoencoder": "An interpretability tool that decompresses the residual stream's superposed features into many sparse, often human-interpretable ones.",
    "hallucination": "Confident generation of false content — a structural consequence of sampling from an imperfect distribution, managed rather than solved.",
    "diffusion": "Generative modeling by learning to reverse a gradual noising process — walk noise backwards into data.",
    "DDPM": "Denoising diffusion probabilistic models — the canonical formulation: train a network to predict the noise added at each step.",
    "score function": "The gradient of log-density, ∇x log p(x) — the vector field pointing toward higher data probability that diffusion models learn.",
    "latent diffusion": "Running diffusion in a VAE's compressed latent space instead of pixels — Stable Diffusion's key efficiency move.",
    "flow matching": "Training a velocity field along straight noise→data paths — simpler objective, fewer sampling steps; behind SD3 and Flux.",
    "classifier-free guidance": "Sampling trick: extrapolate from the unconditional toward the conditional prediction to sharpen prompt adherence.",
    "masked diffusion": "Discrete diffusion for text: corrupt by masking tokens, learn to unmask; generation fills positions in parallel over a few steps.",
    "HBM": "High-bandwidth memory — the GPU's main memory stack; its bandwidth, not compute, bounds decode speed.",
    "goodput": "Throughput that counts — requests per second served within their latency SLO.",
    "context window": "The maximum number of tokens a model can attend over in one sequence.",
    "emergent capability": "An ability that appears abruptly on task metrics as scale grows — usually a step-function metric over smooth loss gains.",
    "superposition": "Packing more features than dimensions into the residual stream as non-orthogonal directions — why raw neurons resist interpretation.",
    "parameter (weight)": "An adjustable number inside a model \u2014 the slope and intercept of a line, or the ~10^12 knobs of a frontier LLM. Written collectively as \u03b8; training sets them, inference freezes them.",
    "loss function": "A single number measuring how badly a model's predictions disagree with the true labels on a dataset. Learning means choosing parameters that push it down; the choice of loss is a design decision, not a given.",
    "mean squared error (MSE)": "The average of squared residuals across a dataset. Squaring kills the sign, punishes large misses disproportionately, and leaves a smooth surface that gradient methods can descend.",
    "residual": "The gap between a model's prediction and the true label for one example, h(x) \u2212 y. MSE is the average of squared residuals; visually, the vertical stalk from a point to the fitted curve.",
    "generalization": "Performance on data the model never saw during training \u2014 the only property a deployed model is actually paid for. Measured by held-out test loss, never by training loss.",
    "overfitting": "When a model uses its flexibility to memorize training data rather than capture the underlying pattern: training loss falls while test loss rises. The gap between the two is overfitting made visible.",
    "train/test split": "Partitioning data before any fitting so the model is tuned on one part and judged on an untouched part. The certificate is conditional: it assumes test data comes from the same distribution, and it weakens every time the test score influences a modeling decision.",
    "Gradient Descent": "The iterative optimization loop at the heart of all modern ML: compute the gradient of the loss with respect to the parameters, step a small distance in the opposite direction, repeat. Every optimizer in this encyclopedia \u2014 SGD, momentum, Adam \u2014 is a decoration of this one update.",
    "Learning Rate (\u03b7)": "The scalar multiplying the gradient in each descent step, controlling how far the parameters move. Too small wastes compute; past the critical value 2/\u03bb set by the loss surface's steepest curvature, every step overshoots and the loss diverges exponentially.",
    "Normal Equation": "The closed-form solution w = (X\u1d40X)\u207b\u00b9X\u1d40y that lands exactly at the bottom of linear regression's loss bowl in one matrix solve. Unusable at scale (the d\u00b3 solve) and unavailable the moment the model becomes nonlinear \u2014 which is why the rest of ML iterates instead.",
    "Convexity": "The property that a loss surface has no false valleys: the line between any two points on it never dips below the surface, so every downhill path reaches the same global minimum. Linear regression with MSE has it; deep networks do not.",
    "Standardization": "Rescaling each feature to zero mean and unit variance, x\u2032 = (x \u2212 \u03bc)/\u03c3, computed on the training set only. It rounds out the loss bowl's curvature so one shared learning rate serves all weights \u2014 frequently the difference between gradient descent converging and exploding.",
    "logistic regression": "A linear classifier that converts the score w\u00b7x + b into a probability via the sigmoid. Still linear \u2014 but in the log-odds, which is why each weight reads as an interpretable odds multiplier.",
    "sigmoid": "The S-shaped squash \u03c3(z) = 1/(1+e\u207b\u1dbb) mapping any real score to (0,1). The exchange rate between evidence and probability \u2014 and softmax's two-class special case.",
    "decision boundary": "The surface where a classifier's predicted probability crosses 0.5 \u2014 for logistic regression, the flat hyperplane w\u00b7x + b = 0. The sigmoid bends probabilities, never the boundary.",
    "precision": "Of everything the model flagged positive, the fraction that was actually positive: TP/(TP+FP). The metric that exposes false alarms.",
    "recall": "Of everything actually positive, the fraction the model caught: TP/(TP+FN). Trades off against precision through the decision threshold.",
    "confusion matrix": "The 2\u00d72 (or K\u00d7K) table splitting predictions into true/false positives and negatives. The raw accounting from which precision, recall, and every honest classification metric derive.",
    "class imbalance": "When one class vastly outnumbers another, so raw accuracy measures the imbalance rather than the model \u2014 a 1-in-1,000 disease makes 'always healthy' 99.9% accurate. Handled by reweighting, resampling, or threshold moving, judged by precision/recall.",
    "k-nearest neighbors (k-NN)": "A classifier with no training step: store the dataset, and label a new point by majority vote of its k closest training examples under a distance metric. All modeling assumptions hide in the distance function, and all compute moves to query time.",
    "curse of dimensionality": "The collapse of 'nearness' as dimensions grow: data becomes exponentially sparse and pairwise distances concentrate, so the gap between nearest and farthest neighbor shrinks toward nothing. Real data often escapes it by lying near lower-dimensional structure.",
    "Gini impurity": "A node-purity score for tree splits: the probability that two random draws from a node carry different labels, 1 \u2212 \u03a3 p_c\u00b2. CART picks the feature\u2013threshold split that reduces it most; the entropy alternative almost never changes the tree.",
    "decision stump": "A depth-1 decision tree \u2014 one feature, one threshold, two predictions. Barely better than chance alone, but it is the standard weak learner that gradient boosting stacks by the hundreds.",
    "bagging": "Bootstrap aggregating: train many high-variance models on bootstrap resamples of the data (each bag holds \u224863.2% of unique points) and average their votes. Averaging n uncorrelated predictors divides error variance by n.",
    "random forest": "Bagging over deep trees plus one decorrelation trick: each split may only consider a random subset of features (\u2248\u221ap), lowering inter-tree correlation and thus the variance floor that plain averaging cannot remove. Out-of-bag points give free validation.",
    "gradient boosting": "An ensemble built sequentially: each shallow tree is fit to the residuals \u2014 more generally the negative gradient of the loss \u2014 of the ensemble so far, scaled by a shrinkage rate \u03b7. XGBoost, LightGBM and CatBoost are its production forms and the default winners on tabular data.",
    "bias\u2013variance decomposition": "The exact split of expected squared error into systematic error of the average fit (bias\u00b2), sensitivity to the particular training sample (variance), and irreducible noise. Capacity buys down bias by paying in variance; the trade-off governs every model-selection decision.",
    "regularization": "Any technique that trades a little bias for a lot of variance reduction by penalizing or constraining model complexity \u2014 L2/weight decay, L1, early stopping, dropout, and data augmentation are all the same idea in different uniforms.",
    "weight decay": "Shrinking weights toward zero by a factor each optimizer step; identical to an L2 penalty under plain SGD but not under adaptive optimizers, which is why AdamW decouples the decay from the adaptive machinery.",
    "cross-validation": "Estimating generalization by splitting data into k folds, training k times with a different fold held out each time, and averaging the held-out scores \u2014 a lower-variance estimate than any single split, at k\u00d7 the compute.",
    "data leakage": "Information from the evaluation side contaminating the training side \u2014 preprocessing fit on the full dataset, duplicates across splits, temporal or group leaks, or features that echo the label. Produces beautiful validation scores and production disasters.",
    "double descent": "The modern amendment to the classical U-curve: push capacity past the point of exact interpolation and held-out error often falls a second time, because gradient descent implicitly prefers low-norm solutions among the many that fit perfectly. The regime modern LLMs train in.",
    "early stopping": "Halting training when validation error stops improving and restoring the best checkpoint. Training time is itself a capacity dial \u2014 for linear least squares, stopping gradient descent at step t is approximately ridge regression with \u03bb \u221d 1/(\u03b7t).",
    "perceptron": "Rosenblatt's 1958 single-layer classifier: a thresholded weighted sum. It can only draw one flat decision boundary \u2014 its provable inability to compute XOR helped trigger the first AI winter.",
    "hidden layer": "Any layer between input and output whose values are learned intermediate features rather than data or targets. The network decides for itself what each hidden unit means.",
    "activation function": "The elementwise nonlinearity applied after a linear layer. Without it, stacked layers collapse algebraically into a single linear model.",
    "ReLU": "max(0, z) \u2014 the activation that made deep networks trainable: its derivative is exactly 1 on the entire active half, so gradients pass through layers unshrunk.",
    "vanishing gradient": "The shrinkage of the learning signal as it is multiplied through many layers of saturating activations \u2014 sigmoid's max derivative of 1/4 compounds to ~10\u207b\u2076 over ten layers. The failure mode that kept pre-2012 networks shallow.",
    "universal approximation": "The theorem that one sufficiently wide hidden layer can approximate any continuous function on a bounded region. An existence result only: it promises nothing about how many units, whether gradient descent finds the weights, or generalization.",
    "dead ReLU": "A ReLU unit whose pre-activation is negative for every input; its gradient is exactly zero and plain gradient descent can never revive it.",
    "backpropagation": "The algorithm that computes the gradient of the loss with respect to every parameter in one backward sweep of the computational graph \u2014 the chain rule applied in reverse topological order so each edge is touched exactly once, at roughly twice the cost of a forward pass.",
    "computational graph": "A directed acyclic graph whose nodes are primitive operations and whose edges carry values forward and local derivatives backward. Autodiff frameworks build it implicitly as your code runs; backprop is a walk over it.",
    "reverse-mode autodiff": "Automatic differentiation that records each operation's inputs and local derivative during the forward pass (PyTorch's grad_fn tape), then computes \u2202loss/\u2202(everything) in a single backward pass \u2014 the property that makes training billions of parameters affordable. Pays its bill in memory: every activation must be\u2026",
    "SGD": "Stochastic gradient descent: update parameters using the gradient averaged over a random minibatch rather than the full dataset. The estimate is unbiased and a step's cost is independent of dataset size \u2014 the fact that makes internet-scale training possible.",
    "minibatch": "The random subset of examples whose averaged gradient drives one SGD step. Gradient-estimate variance falls as 1/|B|, so batch size trades estimation noise against compute per step and hardware utilization; past a critical batch size the extra averaging buys little.",
    "momentum": "An exponential moving average of gradients used as the update direction (v \u2190 \u03b2v + g). Oscillating components cancel and consistent ones accumulate, giving up to a 1/(1\u2212\u03b2) speedup along ravine floors and enough stored velocity to coast over small bumps that trap plain SGD.",
    "gradient check": "Verifying an analytic (backprop) gradient against central finite differences, parameter by parameter. The standard contract: agreement to ~1e-7 in float64 or the backward pass is wrong. Mandatory whenever a gradient is written by hand.",
    "chat template": "The per-model recipe that serializes a messages array (system/user/assistant) into one flat token stream stitched together with special tokens. Serving a model with the wrong template still produces answers \u2014 just silently worse ones.",
    "system prompt": "The standing-instruction region of the context, read before all turns. Its authority over user content is installed by post-training, not enforced by the architecture \u2014 the gap prompt injection exploits.",
    "special token": "A reserved vocabulary item (e.g. <|im_start|>, <|eot_id|>) that delimits turns and signals stops; ordinary text can never tokenize into one. Trained delimiters, not punctuation.",
    "generation cue": "The trailing assistant header a chat template appends so the highest-probability continuation is the model's own reply; generation ends when the model itself emits the end-of-turn token.",
    "lost in the middle": "The empirical U-shape in retrieval accuracy over context position: facts at the start or end of a long prompt are used far more reliably than facts buried mid-context (Liu et al. 2023). Newer long-context training flattens the U without erasing it.",
    "conditioning": "Holding the prompt fixed as the x in p(y | x). Everything prompting achieves is a change of condition over a frozen network \u2014 selection among behaviors the weights can already express, never creation of new capability.",
    "magic words": "Folklore incantations (\"take a deep breath\", offering tips) claimed to boost quality. Measured effects are small, model-specific, and routinely evaporate across versions; they survive because single runs are anecdotes.",
    "Prompt scaffold": "The five-part frame \u2014 Role, Task, Context, Format, Constraints \u2014 that converts a vague request into explicit conditioning evidence. A checklist, not a form: parts that add no information are omitted, not padded.",
    "Role prompting": "Conditioning the model's latent author-persona (\"you are a staff engineer reviewing for OWASP Top 10\") to load vocabulary, conventions, and evaluation criteria. Reliably shifts style and framing; controlled studies find no consistent accuracy gain on factual tasks.",
    "Conjunction tax": "The multiplicative reliability penalty of compound requests: a response that must satisfy k requirements at probability p each succeeds at roughly p^k \u2014 why single-deliverable prompts chained with verification beat one mega-prompt.",
    "Format anchoring": "Showing the output's shape \u2014 a template, labeled fields, structural length bounds \u2014 so the model pattern-completes into it rather than interpreting a prose description of the shape.",
    "Tie-breaker rule": "An explicit precedence clause (\"if brevity and completeness conflict, prefer brevity\") that prevents the model from hedging between two competing goals and serving neither.",
    "Negative constraint": "A prohibition (\"do not mention X\") whose tokens become attendable context, raising the salience of the very topic being forbidden. Best practice pairs every don't with a do \u2014 the boundary plus the preferred alternative.",
    "few-shot prompting": "Including worked input\u2192output examples in the prompt so the model continues the pattern rather than interpreting a description. The strongest single prompting lever, with the largest gain coming from zero to one shot.",
    "zero-shot": "Prompting with instructions only, no examples. The baseline modern instruct models are tuned to excel at \u2014 which is why adding examples to a simple task can drag a strong model below its own default.",
    "recency bias": "The skew of a few-shot prediction toward the label or style of the final example in the block. Permuting the same examples can change the answer; it is why the last slot should hold your most representative demo.",
    "majority-label bias": "Drift of few-shot predictions toward whichever label appears most often among the demonstrations, independent of the test input. Balanced label counts across shots are the first-line mitigation.",
    "format leakage": "The copying of every surface detail of few-shot examples \u2014 key order, casing, response length, punctuation \u2014 into model outputs. A hazard when accidental; when deliberate, the most reliable format-specification mechanism available.",
    "contrastive examples": "Paired good and bad outputs for the same input, each labeled with an explicit why. The annotation converts an instance into a transferable rule and teaches task boundaries that positive examples alone cannot.",
    "exemplar retrieval": "Selecting few-shot examples per query by embedding similarity \u2014 nearest neighbors from a candidate pool \u2014 instead of a fixed set. Reliably raises accuracy but collapses demo diversity and invalidates prefix caching.",
    "many-shot in-context learning": "Few-shot prompting scaled to hundreds or thousands of examples in long contexts. Some tasks keep improving well past the classic saturation point, occasionally approaching fine-tuning quality at fine-tuning-like token economics.",
    "self-consistency": "Sampling N reasoning chains at nonzero temperature and taking the plurality of their final answers \u2014 a Monte-Carlo estimate of the model's marginal answer distribution. Gains saturate around N \u2248 10\u201320 while cost stays linear, and correlated errors across chains cap the benefit.",
    "least-to-most prompting": "A decomposition pattern that first breaks a problem into subquestions ordered easiest to hardest, then solves them sequentially with each answer fed forward. Its signature win is compositional generalization \u2014 solving test problems harder than any demonstration.",
    "step-back prompting": "Asking the model for the governing abstraction ('what principle applies here?') before the specific question. Targets knowledge-heavy reasoning where retrieving the right principle, not applying it, is the bottleneck.",
    "test-time compute": "Computation spent at inference rather than training to improve answers \u2014 serially via longer thinking chains, or in parallel via sampling and voting/verification. On verifiable domains, accuracy rises roughly log-linearly with thinking tokens until the task's ceiling.",
    "thinking budget": "An API-level cap on how many reasoning tokens a reasoning-class model may spend before answering \u2014 explicit token ceilings (budget_tokens, thinking_budget) or categorical effort tiers (reasoning_effort). The control surface that replaced 'think step by step' for models that internalized CoT via RLVR.",
    "chain-of-verification": "A verification protocol: draft an answer, generate verification questions about it, answer them independently without the draft in context, then revise. The independence is load-bearing \u2014 a model shown its own draft tends to confirm it.",
    "CoT faithfulness": "The degree to which a model's emitted reasoning chain reflects the computation that actually produced its answer. Studies show chains can be fluent post-hoc rationalizations \u2014 e.g. never mentioning a planted bias that demonstrably drove the answer \u2014 so a chain buys accuracy more reliably than it buys explanation.",
    "Prefilling": "Starting the assistant turn yourself so the model must continue from your text rather than begin fresh. Forcing the first tokens (e.g. an opening brace) makes preambles impossible by construction \u2014 hard conditioning, not persuasion.",
    "Constrained decoding": "Generation in which a grammar compiled from a schema or regex masks every token that would produce invalid output, making well-formedness a property of the decoder rather than of the model's cooperation. Guarantees syntax, never semantics.",
    "Logit masking": "Setting the logits of disallowed tokens to negative infinity before softmax, so sampling renormalizes over the legal moves only. The mechanism underneath constrained decoding and structured-output APIs.",
    "JSON Schema": "A declarative specification of a JSON object's types, enums, ranges, and required fields. In a prompt it is documentation the model probably follows; compiled into the decoder it becomes an enforceable contract \u2014 and its description strings act as per-field mini-prompts.",
    "Stop sequence": "A string at which the API cuts generation before the model emits it. Paired with a prefilled opening tag, it brackets the response so the payload arrives whole and nothing but.",
    "Defensive parsing": "A pipeline \u2014 extract, repair, parse, validate, retry \u2014 that turns probably-formatted model output into trustworthy data. Mechanical syntax repairs are safe; semantic repairs must be logged or sent back to the model as a correction prompt.",
    "generator\u2013verifier gap": "The empirical asymmetry between a model's ability to produce a correct output and its (usually higher) ability to judge whether a candidate output is correct. When the gap is positive, extra compute is better spent checking and selecting than generating longer.",
    "Reflexion": "An inference-time loop (Shinn et al., 2023) where a model attempts a task, fails against an external signal, distills the failure into a short verbal lesson, and retries conditioned on the accumulated lessons rather than the failed transcripts \u2014 a gradient step taken in natural language, no weights touched.",
    "pre-mortem": "A planning-stage critique that presupposes failure: 'it is six months later and this plan failed \u2014 write the post-incident report.' The tense shift (prospective hindsight) reliably extracts more specific failure causes, early-warning metrics, and plan changes than asking what could go wrong.",
    "council of judges": "N independent LLM judges, each evaluating an artifact through a distinct lens in a separate context, plus an aggregator that tallies verdicts and surfaces disagreements. Reduces single-judge variance the way GRPO's group baseline reduces reward noise \u2014 provided the judges are actually decorrelated.",
    "Condorcet jury theorem": "If n voters decide independently and each is correct with probability p > 1/2, the majority's accuracy rises toward 1 as n grows \u2014 and falls toward 0 if p < 1/2. The mathematical case for judge councils, and the warning that majorities of bad judges converge confidently on wrong answers.",
    "self-preference bias": "The tendency of LLM judges to rate their own generations above equally good alternatives, partly driven by recognizing their own style. The reason a critique pass must run in a fresh context \u2014 ideally a different model \u2014 rather than in the author's own conversation.",
    "AI debate": "An oversight protocol (Irving, Christiano & Amodei, 2018) where two models argue opposing sides and a judge \u2014 possibly weaker than either \u2014 picks the side whose evidence survived rebuttal, on the theory that refuting a lie is easier than detecting one.",
    "golden set": "A small, curated collection of inputs with known-correct or mechanically checkable outputs, used to score every prompt or model change. The unit-test suite of prompt engineering: twenty real-traffic cases beat zero by more than a thousand beat twenty.",
    "LLM-as-judge": "Using a language model to grade or compare other model outputs. Agreement with human majority preference reaches roughly human-human levels on chat-quality tasks, but the judge carries systematic biases \u2014 position, length, self-preference, style-over-substance \u2014 that the eval protocol must cancel.",
    "position bias": "A judge's systematic preference for a response based on the slot it occupies in a pairwise comparison rather than its content. Audited by swapping presentation order and measuring the verdict flip rate; debiased to first order by averaging both orders.",
    "win rate": "The fraction of pairwise comparisons in which one prompt or model beats another \u2014 the standard scalar for A/B evaluation where no single gold answer exists. Subject to the same binomial noise floor as any pass rate.",
    "prompt regression": "A quality drop introduced by editing a prompt \u2014 or by upgrading the underlying model while the prompt stays fixed \u2014 that an eval gate is designed to catch before production. The reason prompts deserve version control, CI, and pinned model IDs.",
    "BYOK": "Bring your own key: a client-side pattern in which the reader's own API key, held only in their browser tab, authorizes requests sent directly to the model provider with no intermediary server.",
    "agentic loop": "The control cycle at the core of every agent: the model emits a tool call, the harness executes it, the observation is appended to context, and the model is called again on the longer transcript. The transcript is the entire runtime state \u2014 the weights never change mid-episode.",
    "tool call": "A structured, schema-conforming action request emitted by the model, naming a function and its arguments. Once a prompting convention parsed out of free text, now a trained behavior with dedicated output formats.",
    "observation": "Whatever the environment returns after an action \u2014 tool output, an error trace, a search result, a screenshot \u2014 appended to context as the model's only window onto the world. Tools that turn silent errors into observations are the cheapest reliability an agent can buy.",
    "computer use": "Driving a graphical interface through screenshots in and clicks or keystrokes out \u2014 the actuator of last resort that turns any application into an agent environment, no API required. Slower and more fragile than native tools, but universal.",
    "trajectory": "The full action\u2013observation sequence of one agent episode, from goal to termination. The unit that long-horizon RL rewards and that agent evals must grade \u2014 expensive, nondeterministic, and different on every run.",
    "context engineering": "The discipline of curating everything a model sees on each call of an agentic loop \u2014 instructions, tools, memory, retrieval, history, notes \u2014 treating the window as a budget rather than a bucket. The successor frame to prompt engineering.",
    "context rot": "The degradation of a model's effective attention as the window fills: facts present in context are used less reliably long before the hard token limit is reached, especially mid-window and amid distractors.",
    "signal-to-token ratio": "Of the tokens about to be added to context, the fraction that changes what the model will do. The working metric of curation \u2014 low-ratio content keeps charging on every subsequent call until something removes it.",
    "compaction": "Replacing the oldest span of an agent's history with a structured summary so the session continues under budget. A lossy codec whose loss function must protect decisions, constraints, and identifiers over chatter.",
    "just-in-time retrieval": "Keeping lightweight references (paths, titles, ids) in context and letting the agent fetch full content through tools when its current hypothesis demands it, instead of front-loading top-k chunks.",
    "write-back discipline": "Updating persistent memory at decision points \u2014 small, structured, dated, reviewed \u2014 so memory tracks reality instead of decaying into fiction. The property that separates working memory systems from decorative ones.",
    "sub-agent": "A fresh context window dedicated to a single concern, spawned with a self-contained brief. It absorbs the token cost of its own exploration and returns a compressed result \u2014 never its transcript.",
    "stable prefix": "The slow-changing front of an agent's context (system prompt, tool schemas, memory file), ordered first so prompt caching can replay its KV state across steps. One changed byte invalidates everything after it.",
    "Description-as-prompt": "The principle that a tool's name, description, and parameter schema are the model's entire understanding of it \u2014 the model never sees the implementation, so tool design is literally prompt engineering with a type signature.",
    "Task-level tool": "A tool sized to a step in the user's intent (e.g. find_orders_for_customer) rather than mapped one-to-one onto a backend endpoint (get_user, get_orders). Task-level tools move orchestration into reliable code and out of the token stream.",
    "Model Context Protocol (MCP)": "An open standard (released late 2024) that lets any agent host connect to any tool/data server through one connector, collapsing an N\u00d7M matrix of bespoke integrations into N+M. Servers expose three primitives: tools (model-invoked), resources (host-attached data), and prompts (user-invoked workflows).",
    "Prompt injection": "The core vulnerability of tool-using systems: because a model cannot reliably distinguish instructions it was given from text it merely read, any untrusted content reaching its context (web pages, emails, tool results) can carry instructions it then follows.",
    "Lethal trifecta": "Simon Willison's framing for when prompt injection escalates to exfiltration: an agent has (1) access to private data, (2) exposure to untrusted content, and (3) an outbound channel. Risk is the product of the three \u2014 zero any one factor and the exploit is defused.",
    "Tool poisoning": "An MCP-specific attack where a malicious server hides hostile instructions inside a tool's description or results; because those words flow into the model's context, the server steers the agent \u2014 prompt injection delivered through an authenticated connection.",
    "blast radius": "The worst-case cost of the most damaging action an agent's environment permits. Sandboxes, write scopes, and checkpoints exist to shrink it \u2014 alignment training alone cannot, because agent inputs are adversarial.",
    "approval fatigue": "The decay of human scrutiny under repeated permission prompts: the first ask of the day gets read, the thirtieth gets reflex-approved in 400 ms. Well-designed harnesses make asks so rare that each one is news.",
    "verifier": "Any ground-truth check a harness can run on an agent's output \u2014 tests, compilers, linters, screenshot diffs. If the harness can check it, the agent can fix it; the verifier's false-pass rate caps achievable reliability no matter how many retries.",
    "idempotent": "A step that lands in the same state whether run once or twice: f(f(s)) = f(s). Idempotent steps make retry-after-partial-failure safe, which matters because agents fail mid-step constantly and get restarted blindly.",
    "git worktree": "A second working directory sharing one repository's object store \u2014 the cheapest unit of agent workspace isolation. Not a security boundary, but it makes parallel attempts and total rollback nearly free: cleanup is deleting a branch.",
    "best-of-N": "Running N parallel attempts at a task and shipping the one a selector prefers. A ground-truth verifier is a perfect selector; an LLM judge is a noisy one whose accuracy multiplies \u2014 and caps \u2014 the whole pipeline.",
    "orchestrator\u2013worker pattern": "Multi-agent topology in which one agent decomposes a task, fans subtasks out to parallel workers, and owns the synthesis of their results. Workers hand back artifacts and structured summaries \u2014 results, not transcripts.",
    "council/judge pattern": "Parallel, isolated agents produce independent judgments on the same input; a judge aggregates by deduplicating, ranking, and discarding outliers. Wins where diversity of judgment is the product; loses wherever a ground-truth verifier exists \u2014 tests beat votes.",
    "watchdog": "A supervisor outside the agent's context window that enforces budgets, detects stalled progress and repeated actions, and can kill the loop. Placed externally because a looping model's own context normalizes the repetition \u2014 you do not ask the loop whether it is a loop.",
    "compaction checkpoint": "A deliberate pause at a clean task boundary \u2014 typically after a verify-pass \u2014 where the agent writes a durable record of goal, decisions, verified state, and next action before its context is compacted, so a fresh instance can resume from the file alone.",
    "heartbeat loop": "A long-horizon pattern in which an agent is re-invoked on a schedule: each beat reads durable state, does one bounded, verified unit of work, writes state back, and exits. A crash costs one beat, not the mission.",
    "model-tier routing": "Assigning each loop step to the cheapest model tier that clears its required success probability \u2014 typically a cheap drafter paired with a strong verifier or escalation model. Speculative decoding's economics lifted from the token level to the task level.",
    "pass@k": "The probability that at least one of k sampled attempts solves a task. Estimated without bias from n samples with c successes as 1 \u2212 C(n\u2212c,k)/C(n,k); the naive plug-in 1\u2212(1\u2212c/n)^k is biased low.",
    "failure taxonomy": "A fixed classification of agent failure modes \u2014 wrong tool, bad args, hallucinated state, gave up, loop \u2014 that turns 'the agent is flaky' into a measurable distribution with an owner per class.",
    "cost per resolved task": "Total spend divided by tasks actually solved: cost-per-run over the resolution rate. The agent KPI that correctly punishes cheap models with collapsed success rates.",
    "eval gate": "A CI rule that blocks any prompt, model, or tool change from shipping unless golden-set and regression scores clear the suite's measured noise floor.",
    "supervised learning": "Learning from (input, correct answer) pairs that someone, somewhere, already produced. The regime where ML's vocabulary is cleanest \u2014 the other regimes reuse nearly all of it.",
    "unsupervised learning": "Extracting structure from inputs alone, with no labels anywhere in the problem \u2014 groups, directions, densities. Every method optimizes a proxy (compactness, variance, reconstruction), and judging whether the proxy matches the purpose is your job, not the algorithm's.",
    "self-supervised learning": "Manufacturing labels out of the raw data itself \u2014 mask a word and predict it, take a prefix and predict the next token. Supervised machinery, free labels, internet scale: how every modern language model pre-trains.",
    "reinforcement learning": "Learning from trial-and-error reward instead of labeled answers: act, get scored, shift toward the actions that scored well. No one shows the model the right answer \u2014 only how good its attempt was.",
    "distribution shift": "When the data a deployed model meets stops resembling the data it trained on \u2014 certified on last year's emails, facing next year's spammers. The train/test certificate assumes the world holds still; it doesn't.",
    "hyperparameter": "A knob you set rather than one the optimizer learns \u2014 learning rate, tree depth, penalty strength \u03bb. Tuned against a validation set, never against the test set.",
    "feature scaling": "Putting features on comparable numeric ranges so no column dominates by accident of units. Distance methods and gradient descent demand it; trees genuinely do not care.",
    "one-hot": "Encoding a category as a vector of zeros with a single 1 in that category's slot. Also the shape of the truth in classification losses: probability 1 on the right class, 0 everywhere else.",
    "Adam": "The adaptive optimizer that gives every parameter its own effective learning rate by tracking running averages of gradients and of squared gradients. Robust to badly conditioned loss surfaces \u2014 the default until AdamW fixed how it handles weight decay.",
    "maximum likelihood": "Choose the parameters that make the observed data most probable. Take the negative log and the standard losses fall out \u2014 minimizing cross-entropy is maximum likelihood in disguise.",
    "hyperplane": "A flat boundary in d dimensions \u2014 a line in 2-D, a plane in 3-D, and the same object beyond visualization. The only decision surface a linear classifier can ever draw.",
    "feature engineering": "Hand-crafting input transformations \u2014 products, squares, ratios \u2014 so a simple model can fit what its raw inputs cannot. Neural networks' entire pitch is learning those transformations instead of waiting for you to invent them.",
    "linearly separable": "A dataset whose classes can be split perfectly by one flat boundary. XOR is the famous four-point proof that not all data is \u2014 and the reason single-layer models hit a wall.",
    "F1 score": "The harmonic mean of precision and recall, 2PR/(P+R) \u2014 one number for one operating point on the precision\u2013recall trade-off. Harsh when the two diverge, which is exactly the point.",
    "Euclidean distance": "Straight-line distance: the square root of summed squared coordinate differences. The default notion of 'near' in k-NN and k-means \u2014 which is why an unscaled feature silently rigs both.",
    "CART": "Classification and regression trees \u2014 the greedy tree-builder: at every node, try each feature and threshold, keep the split that most purifies the children, recurse. The globally optimal tree is NP-complete to find; nobody builds it.",
    "ensemble": "Many models combined \u2014 averaged, voted, or stacked in sequence \u2014 to beat any single member. Forests average away variance; boosting stacks away bias.",
    "XGBoost": "The gradient-boosting library (2016) that added second-order gradients and explicit regularization on leaf weights. With LightGBM and CatBoost, the production face of boosting \u2014 and the baseline any fancier model must beat on tabular data.",
    "inductive bias": "What a model family assumes about the world before seeing any data \u2014 smoothness for neural networks, axis-aligned cuts for trees. The right bias is worth more than data; the wrong one squanders it.",
    "k-means": "The standard clustering loop: place k centroids, assign every point to its nearest, move each centroid to the mean of its points, repeat until nothing changes. Fast and everywhere \u2014 and it silently assumes clusters are round, compact, and similar-sized.",
    "centroid": "A cluster's center of mass \u2014 the mean of the points currently assigned to it. k-means alternates between assigning points to centroids and recomputing centroids from the assignments; the mean is exactly the point that minimizes total squared distance.",
    "silhouette score": "A clustering-quality heuristic comparing each point's distance to its own cluster against the nearest foreign one. One of the standard ways to choose k \u2014 and a judgment call dressed as a number.",
    "dimensionality reduction": "Re-describing each point with fewer coordinates while keeping what matters \u2014 possible because real data is redundant and hugs lower-dimensional structure inside its nominal space. PCA is the linear classic.",
    "PCA": "Principal component analysis \u2014 center the data, then keep the orthogonal directions along which it varies most. Maximizing variance kept and minimizing reconstruction error are provably the same criterion, not two.",
    "covariance matrix": "The d\u00d7d ledger of how every pair of features moves together, variances on the diagonal. PCA is nothing more than the eigendecomposition of this one object.",
    "eigenvector": "A direction a matrix only stretches, never rotates: \u03a3u = \u03bbu. The covariance matrix's top eigenvector is the direction of greatest variance \u2014 PCA's first axis.",
    "eigenvalue": "The stretch factor \u03bb paired with an eigenvector. For a covariance matrix, each eigenvalue is exactly the variance captured along its direction \u2014 and the eigenvalues you drop sum to precisely your reconstruction error.",
    "autoencoder": "A network trained to reproduce its own input through a narrow bottleneck, with reconstruction error as the loss. A linear one provably recovers PCA; nonlinear ones learn the curved sheets PCA cannot.",
    "t-SNE": "A nonlinear 2-D map for looking at high-dimensional data (UMAP is its faster cousin): local neighborhoods survive, global geometry does not. Use it for eyes, never arithmetic \u2014 cluster sizes and distances in the plot are artifacts of the optimizer.",
    "underfitting": "Too little capacity (or training) to capture even the signal: training and held-out error both high and close together. The fix is a bigger model or better features \u2014 more data will not help.",
    "ridge regression": "Least squares plus an L2 penalty \u03bb\u2016w\u2016\u00b2: every weight shrinks toward zero, none reach it, and the closed form just fattens the diagonal of X\u1d40X \u2014 curing its numerical fragility for free. A capacity dial with infinite resolution.",
    "lasso": "Least squares plus an L1 penalty \u03bb\u2016w\u2016\u2081. The kink at zero sets weights with weak evidence to exactly zero \u2014 selection, not just shrinkage \u2014 so the surviving feature set is often the deliverable.",
    "dropout": "During training, zero each hidden unit at random with probability p (scaling the survivors), so no unit can rely on a partner that might vanish. Approximately an ensemble of exponentially many subnetworks; retired from LLM pre-training, alive and well in small-data fine-tunes.",
    "epoch": "One full pass of training over the dataset. Also a capacity dial in disguise: validation error traces a U over epochs, which is exactly what early stopping exploits.",
    "validation set": "The middle split: data used to choose hyperparameters and stopping points, so the test set stays untouched for one final, honest reading. Tune on validation, report on test, never confuse the two.",
    "multi-layer perceptron": "The original neural network: linear layer, elementwise nonlinearity, linear layer. The bend is load-bearing \u2014 delete it and the whole stack collapses algebraically into one linear model.",
    "XOR": "Exclusive-or: true exactly when its two inputs differ. Four points no straight line can separate \u2014 the 1969 proof that froze neural-network research until multi-layer training arrived.",
    "tanh": "The zero-centered sigmoid, squashing scores to (\u22121, 1) with slope 1 at the origin. The RNN-era default hidden activation; it still saturates at both ends, so deep stacks of it starve for gradient.",
    "forward pass": "Running inputs through the network to produce predictions and the loss \u2014 for an MLP, a couple of matrix multiplications. Its values must be kept around: the backward pass consumes them.",
    "backward pass": "The sweep that carries gradients from the loss back through every layer, reusing the values the forward pass stored \u2014 roughly twice the forward FLOPs, every edge of the graph touched exactly once.",
    "chain rule": "Calculus's composition rule: the derivative through nested functions is the product of the local derivatives along the path. Backpropagation is the chain rule scheduled on a graph so that nothing is ever computed twice.",
    "credit assignment": "The central question of learning: when the loss is bad, which of the millions of weights is at fault, and by how much? Backpropagation answers it exactly, for every weight at once, at roughly the cost of one extra forward pass.",
    "residual connections": "Reformulating each layer as h + F(h), so the identity term gives gradients a multiplication-free expressway through depth. The trick that took networks from 20 trainable layers to 152 \u2014 and the spine of every transformer.",
    "exploding gradients": "The mirror image of vanishing: per-layer factors slightly above 1 compound geometrically until one update flings the weights to infinity. Held in check by sane initialization and gradient clipping.",
    "unembedding": "The final projection (the LM head, W_U) that maps the last hidden state back to one logit per vocabulary token. Some models tie it to the embedding matrix to save parameters; most recent large models untie the two for quality.",
    "base model": "A pre-trained LLM before any post-training: a simulator of its training distribution that completes text rather than answering. All capability, no manners \u2014 it will happily continue a question with three more questions.",
    "decoder-only": "The architecture of every modern LLM: one stack of causally-masked transformer blocks that only ever predicts the next token. No encoder, no second sequence to attend to \u2014 the design that won by being the simplest thing that scales.",
    "pre-norm": "Placing normalization at the input of each sub-layer instead of after it, leaving a clean gradient path through the residual additions. The arrangement that made 100+-layer stacks trainable without the original post-norm design's fragile warmup gymnastics.",
    "SiLU": "The smooth activation z\u00b7\u03c3(z), also called swish \u2014 the squash inside SwiGLU's gate path in nearly every modern LLM MLP.",
    "logit lens": "Applying the unembedding to intermediate residual-stream states to watch the model's next-token guess sharpen layer by layer \u2014 direct evidence that the stream is a progressively refined prediction, not an opaque scratchpad.",
    "RoPE base": "The constant b in RoPE's frequency spectrum \u03b8\u1d62 = b^(\u22122i/d): 10,000 originally, 500,000 in Llama 3. Raising it slows every rotation dial at once \u2014 the first ingredient of long context.",
    "online softmax": "Update rules that correct a running max, normalizer, and output as each new tile of scores arrives \u2014 the exact softmax computed without ever holding the full score matrix. The identity that makes FlashAttention possible.",
    "SRAM": "The small, very fast on-chip memory sitting next to a GPU's compute units. FlashAttention's entire trick is keeping attention tiles resident there instead of round-tripping the T\u00d7T score matrix through HBM.",
    "linear attention": "Replacing softmax with feature maps so attention becomes associative and runs in O(T) with a fixed-size state. Historically a quality trade-off; now resurfacing inside SSM-attention hybrid architectures.",
    "NVLink": "NVIDIA's high-bandwidth GPU-to-GPU interconnect inside a server \u2014 the island within which tensor parallelism is affordable, since splitting matmuls costs an all-reduce every single layer.",
    "all-reduce": "The collective operation that sums a tensor across devices and hands every device the full result \u2014 how data-parallel replicas merge gradients each step and tensor-parallel shards merge activations each layer.",
    "micro-batches": "The small slices of a batch streamed through pipeline-parallel stages so all stages stay busy at once. More micro-batches per step shrink the idle 'bubble' at the pipeline's ramp-up and drain.",
    "context parallelism": "Splitting the sequence dimension itself across GPUs \u2014 ring attention passes KV blocks between them \u2014 so million-token training fits in memory. The fourth axis alongside data, tensor, and pipeline parallelism.",
    "master weights": "The FP32 copy of the parameters kept alongside the BF16 compute weights in mixed-precision training. Updates accumulate there, so millions of tiny optimizer steps aren't silently rounded away.",
    "FP16": "16-bit float with a 5-bit exponent \u2014 range capped at \u00b165,504, which forced the loss-scaling dance during training. Displaced by BF16 for training; still common in inference.",
    "WSD": "Warmup\u2013stable\u2013decay: hold the learning rate flat after warmup and decay only in a final phase. Any plateau checkpoint can be branched into its own decay run \u2014 why continual-pre-training shops prefer it to cosine.",
    "GAE": "Generalized advantage estimation \u2014 PPO's method for scoring how much better each token was than expected, computed against a learned value model. The machinery GRPO deletes by substituting a group-mean baseline.",
    "value network": "The learned critic in PPO that predicts expected reward so per-token advantages can be computed. One of RLHF-PPO's four networks in flight \u2014 and the one GRPO's group baseline renders unnecessary.",
    "sycophancy": "Telling the user what they want to hear \u2014 a classic harvest of over-optimizing a learned reward, since agreement rates higher than correction. Scales with capability, which is exactly the worry.",
    "red-teaming": "Deliberate adversarial probing of a model for harmful, deceptive, or policy-breaking behavior before release. The release gate at the end of every production post-training pipeline.",
    "double quantization": "QLoRA's second-order trick: quantize the per-block scale factors themselves, clawing back another ~0.4 bits per parameter on top of NF4.",
    "eval contamination": "Your test set leaking into training data, producing benchmark numbers that are fiction. The reason fine-tuning data must be decontaminated against your evals before a single step is taken.",
    "PTQ": "Post-training quantization \u2014 compressing a finished model with a small calibration set and no retraining. Minutes to hours of work, and how virtually every deployed quantized LLM is made.",
    "GGUF": "The single-file model format of llama.cpp and Ollama: group-wise quantized weights (Q4_K and friends) packed with tokenizer and metadata. The lingua franca of local inference.",
    "exposure bias": "The train/test mismatch baked into teacher forcing: a model trained only on perfect prefixes never learns to recover from its own mistakes. On-policy distillation exists largely to fix it.",
    "calibration set": "The few hundred representative samples a post-training quantization method runs through the model to observe real activations \u2014 the only data GPTQ or AWQ ever see.",
    "tensor cores": "The GPU units that execute small matrix multiplies natively and deliver nearly all of an accelerator's peak FLOPs. If an operation can't be phrased as a matmul, it doesn't get the speed \u2014 which is why 2:4 sparsity is the only sparsity they reward.",
    "pruning": "Zeroing connections outright \u2014 by magnitude, by activation-weighted ranking (Wanda), or with GPTQ-style reconstruction (SparseGPT). Cheap to do, hard to monetize: random zeros don't speed up dense matmul hardware.",
    "draft model": "The small, fast model in speculative decoding that proposes several tokens for the target model to verify in one parallel pass. Pays off when it agrees often \u2014 predictable text like code is its happy place.",
    "rejection sampling": "Accept a drafted token with probability min(1, p/q); on rejection, resample from the corrected residual distribution. The rule that makes speculative decoding provably preserve the target model's exact output distribution.",
    "SLO": "Service-level objective \u2014 the latency promise (TTFT, TPOT) a serving stack commits to per request. Goodput counts only the requests served inside it, which is why schedulers ride the throughput\u2013latency curve explicitly.",
    "vLLM": "The open-source serving engine that introduced PagedAttention and made continuous batching the industry default \u2014 the reference implementation for nearly everything in modern LLM inference.",
    "MTP": "Multi-token prediction \u2014 auxiliary heads trained to guess several future tokens per position. DeepSeek-V3 ships them as a built-in drafter for speculative decoding, no separate draft model needed.",
    "all-to-all": "The collective where every GPU sends a different slice to every other GPU \u2014 the communication pattern expert parallelism pays at each MoE layer to route tokens to their experts and gather the results back.",
    "NTK-aware scaling": "RoPE context extension that raises the base b so fast dimensions are barely touched while slow ones stretch to cover the longer window \u2014 extension without retraining from scratch. YaRN refines the idea with per-frequency interpolation.",
    "cross-attention": "Attention where queries come from one sequence and keys/values from another \u2014 how Flamingo-lineage multimodal models let a language stack tap a vision encoder mid-layer.",
    "scalable oversight": "The open problem of supervising models more capable than their supervisors \u2014 the point past which human ratings stop being a trustworthy training signal. The live research front of alignment.",
    "circuit tracing": "Interpretability work that maps one specific behavior end-to-end through identified attention heads and features. Works for small behaviors today; certifying a frontier model's reasoning remains far out of reach.",
    "VAE": "Variational autoencoder \u2014 an encoder\u2013decoder trained so its compressed latent space is smooth enough to sample from. In the image stack it's the compressor: Stable Diffusion denoises in a VAE latent, and the decoder restores pixels at the end.",
    "ELBO": "The evidence lower bound \u2014 the tractable surrogate for log-likelihood that variational methods maximize. Masked diffusion's weighted unmasking loss is a principled ELBO, not a heuristic.",
    "DiT": "Diffusion transformer \u2014 the backbone that replaced U-Nets for denoising (SD3, Sora-class video runs DiT over spacetime patches), so both great generative families now share one architecture.",
    "U-Net": "The encoder\u2013decoder CNN with skip connections that served as diffusion's denoising backbone from DDPM through Stable Diffusion \u2014 multi-scale by construction, which denoising needs: global layout and local texture at once.",
    "rectified flow": "Flow matching with deliberately straight noise\u2192data paths: regress the constant velocity x\u2081 \u2212 x\u2080 along the line between them. Straighter paths need fewer integration steps at sampling \u2014 the formulation behind SD3 and Flux.",
    "DDIM": "The deterministic, skippable reformulation of DDPM sampling: same trained network, but the reverse walk takes ~50 steps instead of 1,000. The first big step-count collapse, and the on-ramp to ODE-based samplers.",
    "implicit Bayesian inference": "The leading account of why in-context learning works: the model behaves as if it infers which latent document type produced the prompt, then continues accordingly (Xie et al. 2021). A behavioral description, not an architecture fact \u2014 no posterior is computed anywhere in the network.",
    "positional priors": "The trained tendencies that make location in context matter: strong at the start, strong at the end, a trough in the middle. Attention could reach anywhere; training data taught it where to look.",
    "needle-in-a-haystack": "The long-context benchmark family: plant one fact in a huge context and ask for it back. Frontier models now ace it \u2014 which says little about multi-fact reasoning over the same window.",
    "held-out set": "Evaluation cases deliberately kept out of the tuning loop and consulted only to confirm a change before shipping. The moment you iterate against it, it stops measuring generalization.",
    "post-training": "Everything done to a model after pre-training \u2014 SFT, RLHF, RLVR \u2014 that turns a document-completer into an assistant. System-prompt authority, chat formatting, and instruction-following are all installed here; none are architectural.",
    "instruction-tuned model": "A model post-trained on instruction\u2192response data so plain requests work zero-shot. The reason expert-flattery roles add little: post-training already collapsed the persona prior onto competent-expert.",
    "compound tasks": "Prompts demanding several deliverables in one response. Joint success is roughly the product of per-requirement probabilities \u2014 six 90% requirements make a coin flip \u2014 so decompose and verify between steps instead.",
    "pink-elephant problem": "The salience trap of prohibitions: every token of \"do not mention the outage\" places the outage squarely in attendable context. Mitigated by pairing every don't with a do.",
    "XML tags": "Angle-bracket delimiters (<analysis>\u2026</analysis>) marking regions of a prompt or output. Rare token sequences attention can bind to exactly, no escaping rules, parseable the moment they close \u2014 and Claude-family models are conspicuously trained on them.",
    "decomposition": "Splitting one hard prompt into subproblems solved in sequence, each verified output feeding the next. Converts a single low-probability mega-task into several high-probability steps with inspection gates between them.",
    "task recognition": "What few-shot examples mostly transmit: which task \u2014 format, label space, input distribution \u2014 rather than how to do it. Min et al. (2022) showed random labels in the demos barely dent accuracy; larger models add genuine rule extraction on top.",
    "semantic priors": "What a model already believes a label or word means from pre-training. Small models lean on them and ignore your flipped few-shot labels; frontier models override them and follow the demonstrations.",
    "saturation curve": "The shape of accuracy versus example count: a steep rise that flattens fast, with the largest single jump from zero to one shot. Format tasks saturate by two examples, classification by four to eight, reasoning barely moves.",
    "common-token bias": "The few-shot skew toward labels made of frequent tokens, independent of the input. One of Zhao et al.'s three demonstration biases, alongside majority-label and recency.",
    "cosine similarity": "The standard closeness measure between embedding vectors \u2014 the cosine of the angle between them, length ignored. The metric behind nearest-neighbor example retrieval and most RAG ranking.",
    "label space": "The set of allowed outputs for a classification task. Few-shot examples transmit it implicitly \u2014 show three sentiment labels and the model stops inventing a fourth.",
    "contextual calibration": "Few-shot debiasing: measure the model's prediction on a content-free input like \"N/A\" and divide that skew out. Recovers most of the accuracy lost to ordering and label-frequency biases \u2014 when you control the decoding stack.",
    "scratchpad": "The intermediate tokens a model writes while reasoning \u2014 not commentary on the computation but the computation itself: each emitted token buys another serial pass through the layers and becomes readable working memory for every later step.",
    "latent variable": "A quantity the math sums over but nobody observes \u2014 in CoT analysis, the reasoning path between question and answer. Chain-of-thought samples one path explicitly and conditions on it instead of averaging them all away.",
    "Monte Carlo": "Estimating a quantity by random sampling rather than exact computation. Self-consistency is Monte Carlo over reasoning paths: sample N chains and let the plurality vote approximate the model's marginal answer.",
    "Tree-of-Thoughts": "Test-time search over partial reasoning chains: branch at intermediate steps, score the branches, expand the promising ones. Self-consistency's more ambitious cousin \u2014 rarely worth the orchestration below frontier-hard tasks.",
    "cons@64": "Consistency at 64: accuracy when 64 sampled reasoning chains vote and the plurality answer is graded. The standard eval flavor of self-consistency on frontier reasoning benchmarks.",
    "effort dial": "The API control that replaced \"think step by step\" on reasoning models: a categorical tier (minimal \u00b7 low \u00b7 medium \u00b7 high) under which the model budgets its own thinking tokens. You stopped steering the path and started budgeting it.",
    "reasoning model": "A model RL-trained against verifiable rewards until long internal chains \u2014 backtracking, self-checks \u2014 became default behavior. Prompt the outcome and dial the effort; manual CoT instructions fight the trained policy and often hurt.",
    "plan-then-solve": "The decomposition pattern that asks for a plan first, then its execution step by step. Fixes diving in mid-problem; shines on multi-constraint tasks where missed requirements, not bad arithmetic, kill you.",
    "self-correction": "Asking a model to review and fix its own answer. With an external signal \u2014 tests, validators, retrieval \u2014 it works; without one it frequently talks itself out of correct answers, measured as net-negative on reasoning benchmarks (Huang et al. 2024).",
    "compositional generalization": "Solving problems built from familiar pieces combined in harder ways than anything demonstrated. The signature win of least-to-most prompting.",
    "structured output": "Model output shaped for a parser rather than a person: fixed fields, schemas, machine-checkable syntax. The moment output feeds code, formatting stops being style and becomes contract.",
    "function calling": "The API pattern where the model emits a schema-validated call to a named tool instead of prose \u2014 structured output wearing a dispatcher. The description strings in the tool schema are the highest-leverage prompt tokens you own.",
    "context-free grammar": "A formal ruleset defining which strings are legal \u2014 JSON, SQL, your DSL. Constrained decoding compiles one into an automaton that masks every token the grammar forbids.",
    "self-critique": "A second pass in which the model grades a draft against explicit criteria before revising. Works only when the critic runs in a fresh context \u2014 an author still warm in its own transcript reliably approves its own work.",
    "red team": "A review run as an attack: a hostile-reviewer persona hunting failure modes, edge cases, and abuse paths instead of gentle fixes. Findings are candidates, not confirmations \u2014 demand a concrete reproduction trigger per finding.",
    "rubric": "A short list of checkable criteria \u2014 each quotable, falsifiable, pass/fail \u2014 that converts \"make it better\" into verdicts a critic must defend by pointing at text. Many small booleans beat one holistic 1\u201310.",
    "revision drift": "The failure where a model \"improving\" a draft quietly rewrites the parts that were already right. Leashed with one instruction: change nothing the critique did not flag.",
    "quote-to-convict": "The critique rule that every verdict must cite the exact text earning it. Doubles as a hallucination filter: a criticism that cannot point at words is usually invented.",
    "prospective hindsight": "The pre-mortem's engine: presuppose the failure already happened \u2014 \"it is six months later; explain\" \u2014 instead of asking what could go wrong. The tense shift measurably increases the number and specificity of failure causes generated.",
    "HumanEval": "OpenAI's benchmark of small Python functions graded by hidden unit tests \u2014 the standard scoreboard for code generation, reported as pass@k.",
    "noise floor": "How much an eval score wobbles when nothing changes \u2014 binomial noise at small n, sampling variance always. At n = 20 the 95% interval spans roughly \u00b120 points; gating on movements smaller than the floor breeds alarms nobody trusts.",
    "standard error": "The expected wobble of an estimated rate: \u221a(p(1\u2212p)/n) for a pass rate over n cases. The reason a 20-case eval catches a collapse but cannot certify a 5-point refinement.",
    "flip rate": "The fraction of pairwise verdicts that change when the two candidates swap presentation order. A judge audit needing zero ground truth: every flip means the seating chart, not the quality, got read.",
    "length bias": "The LLM-judge tendency to reward longer answers regardless of content \u2014 verbosity reads as effort. Countered with length-controlled win rates and an explicit do-not-reward-length rubric line.",
    "MT-Bench": "The 2023 benchmark (Zheng et al.) that legitimized LLM-as-judge: frontier judges agreed with human majority preference about as often as humans agree with each other. Its strict variant counts only wins that survive an order swap.",
    "reference answer": "A known-good answer handed to an LLM judge as the comparison anchor. The cheapest fix for style-over-substance bias: correctness gets graded against something, not against polish.",
    "mega-prompt": "The 3,000-word accumulation of patches where the actual task hides on line 41 and two format rules contradict. Refactor it like legacy code \u2014 dedupe, delete rules that cite no failure \u2014 with an eval to prove the refactor safe.",
    "ground truth": "The verified correct answer an evaluation compares against \u2014 tests pass, label matches, number checks. Whatever an eval cannot anchor to ground truth it must anchor to a judge, who then needs auditing in turn.",
    "sandbox": "The bounded environment an agent's tool calls execute in \u2014 filesystem, process, and network walls sized so the worst permitted action is affordable. It protects the host from the agent, not the sandbox's contents from the agent: secrets mounted inside are inside the blast radius.",
    "allowlist": "A permission policy that enumerates the finite set of safe actions and refuses everything else. The alternative \u2014 denylisting bad commands \u2014 is a parlor game against an attacker who can base64-encode.",
    "kill switch": "One flag that halts new agent runs and drains in-flight ones. Fire-drill it quarterly: a kill switch that has never been pulled is a hypothesis, not a control.",
    "regression suite": "The golden set plus one new task per fixed incident, run nightly and pre-deploy. It only grows; deleting a task requires a written reason.",
    "span tree": "The nested structure of an agent trace: each step is a timed span, and sub-agent work nests under the step that spawned it. Borrowed from distributed-systems tracing, which solved the same problem first.",
    "orchestrator": "The agent that owns the plan in a multi-agent system: it decomposes the task, briefs the workers, and holds only their results in its window. Also the serial bottleneck at the end of every parallel fan-out.",
    "scaffold": "Everything wrapped around the model in a benchmark or product run \u2014 tools, prompts, retry budget, verifiers. A leaderboard number is a property of model plus scaffold together; nothing about the model alone transfers.",
    "task horizon": "METR's capability metric: the longest task, in human time, a model completes at 50% reliability. The fitted curve doubles roughly every seven months \u2014 and shrinks about 5\u00d7 when the success bar moves to 80%.",
    "memory file": "A curated, project-scoped document of conventions, decisions, and preferences (the CLAUDE.md pattern), loaded into the stable prefix of every session. Stale entries get treated as live truth, which is why writes go through review.",
    "progressive disclosure": "Keeping lightweight references in context \u2014 file paths, titles, schema names \u2014 and letting the agent fetch full content on demand. The context holds the map; tools fetch the territory.",
    "BM25": "The classic keyword-ranking function for lexical search. Paired with embeddings in hybrid retrieval because it trivially catches exact identifiers \u2014 error codes, function names \u2014 that semantic similarity famously misses.",
    "single-writer rule": "One agent per mutable resource. Two agents editing the same file is a merge-conflict generator with extra steps; the stable multi-agent shape is read-heavy fan-out feeding a single writer.",
    "fan-out": "Dispatching independent subtasks to parallel workers at once. It multiplies token spend but collapses wall-clock to the slowest branch plus synthesis \u2014 and only pays when the subtasks are genuinely independent.",
    "actionable density": "Of the tokens a tool returns, the fraction that bears on the model's next decision. Raw API payloads sit near 0.05; good tools filter, rename, round, and summarize at the boundary to push it toward 1.",
    "cross-server shadowing": "An MCP attack where one server's tool descriptions manipulate how the model uses another server's tools \u2014 possible because every connected server's words land in the same context and steer the same policy.",
    "MCP server": "A separate process, local or remote, exposing tools, resources, and prompts to any MCP-speaking host over JSON-RPC. Its descriptions and results flow straight into your model's context \u2014 treat an untrusted server exactly like untrusted code.",
    "content quarantine": "An injection defense that tracks the provenance of untrusted text and fences it off from acting as instructions. The most principled of the defenses \u2014 and still not airtight, since cleanly separating data from commands remains an open problem.",
    "CaMeL": "A defense design that splits the agent into a privileged model that plans and a quarantined model that reads untrusted content, so injected text never reaches the part that can act.",
    "defense in depth": "Stacking imperfect defenses \u2014 quarantine, allowlists, human gates \u2014 so an attack must beat all of them, while designing so the lethal trifecta never assembles in one agent in the first place.",
    "accessibility tree": "The structured, named-element view of a UI that screen readers consume. For computer-use agents it beats raw pixels: elements to act on instead of coordinates to guess.",
    "exfiltration": "Smuggling private data out through any channel an attacker can observe \u2014 a URL, an email, a webhook. The payoff of prompt injection, and the reason an agent's outbound channels deserve the most paranoia.",
    "microVM": "A minimal virtual machine (Firecracker is the canonical one) that gives each agent its own guest kernel. The isolation tier for untrusted code at scale, where a shared-kernel container escape would be fatal.",
    "default-deny": "The network posture for agent sandboxes: block all egress, then allowlist a short list of package registries and APIs. An injected agent with no egress can only corrupt its own cell; the same agent with open egress can exfiltrate everything in it.",
    "human gate": "A hard stop that routes an irreversible action \u2014 deploy, send, delete, pay \u2014 through a human before it executes. Gate by undo cost, not anxiety: gating the recoverable mints fatigue, not safety.",
    "plan gate": "A mechanical check of the plan before the first expensive action: do the referenced files exist, are all constraints covered, is the step count inside budget? A verifier for intentions \u2014 it catches the failure class where every step succeeds toward the wrong goal.",
    "stop condition": "An explicit answer to when the loop ends that does not rely on the model's own judgment: budget caps, progress windows, loop detection, an external watchdog. 'When the model decides it's done' is the thing being supervised, not an answer.",
    "loop detection": "Hashing recent (tool, arguments) pairs to catch an agent repeating itself \u2014 the same call N times, or A\u2192B\u2192A oscillation. External by necessity: a looping model's own context normalizes the repetition.",
    "budget caps": "Hard per-run ceilings on steps, tokens, dollars, and wall-clock, enforced by the harness inside the loop \u2014 never merely requested in the prompt. A cap hit should end in a graceful summarize-and-stop, logged as its own failure class.",
    "critical path": "The longest chain of serially dependent steps, which sets wall-clock latency regardless of total work. Cost follows the sum; latency follows the critical path \u2014 fan-out shortens the second while growing the first.",
    "state amnesia": "The long-horizon failure mode where compaction and restarts shed the agent's decisions and their reasons until it relitigates or contradicts its own past. The cure is moving program state out of the window into durable files.",
    "ratchet": "The recovery discipline of committing after every verified-green state and never on red, so history is a monotone sequence of working states and undo is one git reset. Cheap rollback is what makes aggressive attempts affordable.",
    "eval pyramid": "The layered eval stack: deterministic prompt asserts at the base, tool-call accuracy, judged trajectories, and expensive end-to-end task success at the tip. Volume falls as fidelity rises, and each layer catches what the one below cannot see.",
    "pass@1": "Success probability with a single attempt \u2014 what a production agent actually experiences. A pass@8 headline is legitimate only when a real verifier picks the winner among eight; otherwise the k is doing the marketing.",
    "pass^k": "The probability that all k runs succeed \u2014 the reliability view, punishing variance where pass@k rewards it. The number an operator who must trust every run should be asking for.",
    "outcome leakage": "A judge bias unique to trajectories: if the judge can see the run ended in success, it retroactively scores every step as reasonable. Strip the final outcome when you want a genuine process grade.",
    "cache hit rate": "The fraction of input tokens served from the provider's prefix cache, billed at roughly a tenth of the fresh-token rate. A prompt edit that silently breaks the stable prefix shows up here first \u2014 and doubles the bill.",
    "resolution rate": "The fraction of agent runs that actually solve the task \u2014 the denominator that converts cost per run into cost per resolved task. Sloppy model down-tiering destroys it quietly, which is why routing changes are approved on cost per resolved task, never cost per run.",
    "SWE-bench Verified": "The human-validated subset of SWE-bench: real GitHub issues an agent must patch inside a containerized repo, graded by the repo's own tests. Resolution is verified by execution, not judgment \u2014 but the score belongs to model plus scaffold, not the model alone.",
    "OSWorld": "A benchmark of real desktop tasks driven through screenshots, clicks, and keystrokes \u2014 the standard yardstick for computer-use agents. Success rates went from roughly 15% to above 60% in two years, against a human baseline near 72%."
  };

  /* longest-first alternation so "multi-head attention" beats "attention" */
  var TERMS = Object.keys(DEFS).sort(function (a, b) { return b.length - a.length; });
  var PATTERN = new RegExp(
    "\\b(" + TERMS.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[- ]/g, "[- ]");
    }).join("|") + ")\\b", "i"
  );

  var SKIP = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, A: 1, H1: 1, H2: 1, H3: 1, BUTTON: 1, SVG: 1, CANVAS: 1, SELECT: 1, INPUT: 1, OUTPUT: 1 };

  function skippable(el, allowWidget) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (SKIP[n.tagName]) return true;
      var c = n.className;
      if (typeof c === "string") {
        if (c.indexOf("katex") !== -1 || c.indexOf("gloss") !== -1 ||
            c.indexOf("topbar") !== -1 || c.indexOf("side-nav") !== -1 ||
            c.indexOf("pager") !== -1) return true;
        /* inside widgets, only curated surfaces are glossed */
        if (!allowWidget && c.indexOf("widget") !== -1) return true;
        if (allowWidget && (c.indexOf("readout") !== -1 || c.indexOf("tok-") === 0 ||
            c.indexOf("r-value") !== -1)) return true;
        if (c.indexOf("eq-tag") !== -1) return true;
      }
    }
    return false;
  }

  var seen = {};   // term (lowercase) -> wrap count on this page
  var MAX_PER_TERM = 4;

  function canonical(raw) {
    var low = raw.toLowerCase().replace(/[- ]+/g, " ");
    for (var i = 0; i < TERMS.length; i++) {
      if (TERMS[i].toLowerCase().replace(/[- ]+/g, " ") === low) return TERMS[i];
    }
    return null;
  }

  function scan() {
    if (scan.done) return;
    scan.done = true;
    /* prose surfaces, plus curated widget surfaces (notes + control labels)
       and hub/landing surfaces — anywhere a reader meets a term cold */
    var PROSE = "main p, main li, main td, main .fig-cap, .lede, .eq-note, .eq-x-body, .t-desc, .how-card p, .cov-sub, .dr-exp";
    var WIDGETY = ".w-note, .ctl label, .drill .dr-q";
    var roots = [];
    document.querySelectorAll(PROSE).forEach(function (r) { roots.push({ el: r, w: false }); });
    document.querySelectorAll(WIDGETY).forEach(function (r) { roots.push({ el: r, w: true }); });
    roots.forEach(function (entry) {
      var root = entry.el, allowW = entry.w;
      if (skippable(root, allowW)) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          return skippable(node.parentElement, allowW) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (textNode) {
        var text = textNode.nodeValue;
        var m = PATTERN.exec(text);
        if (!m) return;
        var term = canonical(m[1]);
        if (!term) return;
        var key = term.toLowerCase();
        if ((seen[key] || 0) >= MAX_PER_TERM) return;
        seen[key] = (seen[key] || 0) + 1;

        var span = document.createElement("span");
        span.className = "gloss";
        span.setAttribute("data-term", term);
        span.textContent = m[1];
        var after = textNode.splitText(m.index);
        after.nodeValue = after.nodeValue.slice(m[1].length);
        textNode.parentNode.insertBefore(span, after);
        /* one wrap per text node is enough — keeps DOM churn low */
      });
    });
    attachTip();
  }

  /* ---------- tooltip ---------- */
  function attachTip() {
    var tip = document.createElement("div");
    tip.className = "gloss-tip";
    tip.innerHTML = "<div class='gt-term'></div><div class='gt-body'></div>";
    document.body.appendChild(tip);
    var termEl = tip.querySelector(".gt-term"), bodyEl = tip.querySelector(".gt-body");

    function show(target) {
      var term = target.getAttribute("data-term");
      termEl.textContent = term;
      bodyEl.textContent = DEFS[term];
      var r = target.getBoundingClientRect();
      tip.style.left = "0px"; tip.style.top = "0px";
      tip.classList.add("show");
      /* measure after content set */
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var x = Math.min(Math.max(8, r.left), window.innerWidth - tw - 8);
      var y = r.top - th - 10;
      if (y < 64) y = r.bottom + 10;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }
    function hide() { tip.classList.remove("show"); }

    var DESKTOP = window.matchMedia("(min-width: 60em)").matches;

    /* hover = quick glance (desktop only); never while the dock-driven
       detail is the intended interaction on a touch device */
    document.addEventListener("mouseover", function (e) {
      var g = e.target.closest && e.target.closest(".gloss");
      if (g && DESKTOP) show(g);
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(".gloss")) hide();
    });
    document.addEventListener("scroll", hide, { passive: true });

    /* click = detailed explanation. Desktop: open the right-side dock with
       the full definition + explorable related terms. Mobile: toggle the
       inline tooltip (the dock is desktop-only). */
    document.addEventListener("click", function (e) {
      var g = e.target.closest && e.target.closest(".gloss");
      if (!g) { hide(); return; }
      var term = g.getAttribute("data-term");
      if (DESKTOP && window.AIEDock && DEFS[term]) {
        e.preventDefault();
        hide();
        openReferenceFor(term);
      } else {
        if (tip.classList.contains("show")) hide(); else show(g);
      }
    });
  }

  /* related terms = other glossary entries named inside this definition
     (longest-first, word-bounded), so the dock becomes explorable */
  function relatedFor(term) {
    var def = " " + (DEFS[term] || "") + " ";
    var rel = [];
    for (var i = 0; i < TERMS.length && rel.length < 8; i++) {
      var t = TERMS[i];
      if (t.toLowerCase() === term.toLowerCase()) continue;
      var esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[- ]/g, "[- ]");
      if (new RegExp("(^|[^A-Za-z])" + esc + "([^A-Za-z]|$)", "i").test(def)) rel.push(t);
    }
    return rel;
  }
  function openReferenceFor(term) {
    if (!DEFS[term] || !window.AIEDock) return;
    window.AIEDock.openReference({
      term: term,
      def: DEFS[term],
      related: relatedFor(term),
      onRelated: openReferenceFor
    });
  }

  window.__glossaryScan = scan;
  /* fallback if KaTeX never loads (offline): scan anyway after 2.5s */
  setTimeout(scan, 2500);
})();
