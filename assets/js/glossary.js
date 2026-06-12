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
    "eval gate": "A CI rule that blocks any prompt, model, or tool change from shipping unless golden-set and regression scores clear the suite's measured noise floor."
  };

  /* longest-first alternation so "multi-head attention" beats "attention" */
  var TERMS = Object.keys(DEFS).sort(function (a, b) { return b.length - a.length; });
  var PATTERN = new RegExp(
    "\\b(" + TERMS.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[- ]/g, "[- ]");
    }).join("|") + ")\\b", "i"
  );

  var SKIP = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, A: 1, H1: 1, H2: 1, H3: 1, BUTTON: 1, SVG: 1, CANVAS: 1, SELECT: 1, INPUT: 1, LABEL: 1, OUTPUT: 1 };

  function skippable(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (SKIP[n.tagName]) return true;
      var c = n.className;
      if (typeof c === "string" && (
        c.indexOf("katex") !== -1 || c.indexOf("gloss") !== -1 ||
        c.indexOf("widget") !== -1 || c.indexOf("topbar") !== -1 ||
        c.indexOf("side-nav") !== -1 || c.indexOf("pager") !== -1 ||
        c.indexOf("eq") === 0
      )) return true;
    }
    return false;
  }

  var seen = {};   // term (lowercase) -> wrap count on this page
  var MAX_PER_TERM = 2;

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
    var roots = document.querySelectorAll("main p, main li, main td, main .fig-cap");
    roots.forEach(function (root) {
      if (skippable(root)) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          return skippable(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
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

    document.addEventListener("mouseover", function (e) {
      var g = e.target.closest && e.target.closest(".gloss");
      if (g) show(g);
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(".gloss")) hide();
    });
    document.addEventListener("scroll", hide, { passive: true });
    /* touch: tap toggles */
    document.addEventListener("click", function (e) {
      var g = e.target.closest && e.target.closest(".gloss");
      if (g) { if (tip.classList.contains("show")) hide(); else show(g); }
      else hide();
    });
  }

  window.__glossaryScan = scan;
  /* fallback if KaTeX never loads (offline): scan anyway after 2.5s */
  setTimeout(scan, 2500);
})();
