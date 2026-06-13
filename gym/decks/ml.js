/* ============================================================
   THE GYM — DECK: VOL I FOUNDATIONS
   9 MCQ · 1 numeric · 3 numpy katas
   MCQ options are length-balanced (±25% within each item) and the
   engine shuffles their order at render time — read, don't meta-game.
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.ml = {
  id: "ml",
  vol: "VOL I — FOUNDATIONS",
  title: "Foundations Drills",
  desc: "Losses, gradient descent, generalization, k-means, backprop — plus three numpy katas. The bedrock everything else stands on.",
  items: [

    {
      type: "mcq",
      q: "You're predicting house prices and the dataset contains a few mansions with wildly wrong listed prices (label noise). Training with MSE rather than MAE, what should you expect?",
      opts: [
        "Little difference — both losses measure the same residuals, so the two fitted models end up nearly identical",
        "The model bends toward the noisy mansions — squaring makes their large errors dominate the total loss",
        "MAE overfits the mansions instead, since it weights every residual equally rather than damping large ones",
        "MSE shrugs off the outliers, because averaging over the full dataset washes out a handful of bad labels"
      ],
      correct: 1,
      exp: "<b>Squaring is a choice about whose errors matter.</b> Under MSE an error of 10 costs 100&times; an error of 1, and the gradient \\(2(\\hat{y}-y)\\) grows linearly with the miss — so a few corrupted labels pull the fit hard. MAE's gradient is &plusmn;1 regardless of size, making it robust but non-smooth at zero. Huber loss is the standard compromise: quadratic near zero, linear in the tails."
    },

    {
      type: "mcq",
      q: "Minimizing a clean quadratic bowl with gradient descent, you triple the learning rate. The loss now bounces side to side and <em>grows</em> every step. What's happening?",
      opts: [
        "The optimizer has fallen into a saddle point, where misleading gradients send it climbing the surface",
        "Gradients are vanishing — steps are now too small to make progress, so noise dominates the loss curve",
        "Each update overshoots the minimum and lands higher on the opposite wall — divergence past the critical rate",
        "The loss surface itself shifts after every update as the weights move, invalidating the old descent direction"
      ],
      correct: 2,
      exp: "On a quadratic with curvature \\(\\lambda\\), gradient descent converges only if \\(\\eta &lt; 2/\\lambda\\). Just below the limit it oscillates while shrinking; above it, each bounce is bigger than the last — <b>monotonic growth with sign-flipping loss is the classic signature of a too-large learning rate</b>, not a data or architecture problem. The fix is to lower \\(\\eta\\), not to train longer."
    },

    {
      type: "mcq",
      q: "Linear regression with two raw features: square meters (range 0–500) and bathroom count (range 0–5). Vanilla gradient descent zig-zags and converges painfully slowly. Highest-leverage fix?",
      opts: [
        "Standardize the features — equal scales round out the stretched elliptical loss contours toward circular",
        "Run many more iterations at a smaller rate; on a convex loss convergence is eventually guaranteed regardless",
        "Switch the loss from MSE to MAE, whose constant gradients keep either feature from dominating the step",
        "Shrink the batch size — the extra stochastic noise helps the optimizer rattle out of the narrow valley"
      ],
      correct: 0,
      exp: "Wildly different feature scales make the loss surface a long thin valley (high condition number). The gradient points <em>across</em> the valley, not along it, so steps ricochet between walls. <b>Normalization is an optimization fix, not just hygiene</b> — it's also why Adam-style per-coordinate scaling and normalization layers matter so much in deep nets."
    },

    {
      type: "mcq",
      q: "Training loss keeps falling. Validation loss fell, bottomed at epoch 12, and has climbed ever since. At epoch 40 the model is best described as:",
      opts: [
        "Underfit — both curves would still flatten together after convergence, so training more epochs is the call",
        "Badly initialized — a luckier random seed would have landed in a basin where both losses fall in lockstep",
        "Starved by a too-low learning rate — the optimizer crawls so slowly that validation noise dominates the curve",
        "Overfit — it's memorizing training-set specifics; the epoch-12 checkpoint generalizes better than this one"
      ],
      correct: 3,
      exp: "A widening train/validation gap is the operational definition of overfitting. <b>The best model is not the last one</b> — early stopping (keep the epoch-12 checkpoint) is the cheapest regularizer available. The other levers: more data, augmentation, weight decay, dropout, or a smaller model. Note the diagnosis required <em>both</em> curves; training loss alone tells you nothing about generalization."
    },

    {
      type: "mcq",
      q: "A model scores 34% error on its own training data and 35% on validation; humans manage ~5%. What's the dominant problem, and the fix?",
      opts: [
        "High variance — the model is fitting noise, so the priority is collecting substantially more training data",
        "High bias — it can't even fit the data it has seen; add capacity or train longer before anything else",
        "High variance — regularize harder with dropout and weight decay until the validation gap closes up",
        "Data leakage — near-identical train and validation errors usually mean the validation set is contaminated"
      ],
      correct: 1,
      exp: "Train error far above the achievable floor = <b>bias problem</b>; the tiny 1-point train/val gap says variance is fine. More data is useless here — the model already fails on the data it's seen. The bias/variance decision procedure: compare train error to the human/Bayes floor first, then the train→val gap. Fixes ordered by the failing term, not by habit."
    },

    {
      type: "mcq",
      q: "You want the model to automatically zero-out irrelevant features so the result is interpretable. Which regularizer, and why?",
      opts: [
        "L2 — its smooth quadratic penalty shrinks every irrelevant weight cleanly and stably down to exactly zero",
        "Early stopping — halting the run before convergence keeps irrelevant features from ever acquiring any weight",
        "L1 — its constant-magnitude pull drives small weights to exactly zero, giving sparse, readable models",
        "Either one works — L1 and L2 reach the same sparse optimum and differ only in convergence speed"
      ],
      correct: 2,
      exp: "L2's penalty gradient is proportional to \\(w\\) — as a weight approaches zero the push fades, so weights shrink but <b>almost never reach exactly zero</b>. L1's push is constant, so small weights get driven to the axis. Geometric picture: the L1 constraint ball is a diamond, and optima land on its corners where coordinates are zero. That's lasso = built-in feature selection."
    },

    {
      type: "mcq",
      q: "k-means with k = 2 on two concentric rings carves a useless straight split down the middle. Why is this unavoidable for k-means?",
      opts: [
        "k is simply too small — with k = 4, the extra centroids would lock onto and trace the two rings",
        "Its clusters are Voronoi cells around centroids — always convex, and a ring is not a convex region",
        "Too few iterations — with enough alternation steps, the centroids drift into the two ring centers",
        "It needs labeled examples of each ring; unsupervised objectives cannot separate nested shapes alone"
      ],
      correct: 1,
      exp: "Each point joins its <em>nearest centroid</em>, so the partition is always a set of convex cells, whatever k you choose — more centroids just shatters the rings into arcs. <b>The objective defines what 'cluster' means</b>: k-means assumes compact blobs of similar radius. For connectivity-shaped structure use spectral clustering, DBSCAN, or transform features (here: radius from center makes it trivially separable)."
    },

    {
      type: "mcq",
      q: "Backpropagation is best described as:",
      opts: [
        "Reverse-mode autodiff — one backward chain-rule pass prices every parameter's gradient simultaneously",
        "A learning rule distinct from gradient descent that decides which direction each weight should move",
        "Finite differences at scale — nudge each weight in turn, rerun the forward pass, record the loss change",
        "A biologically faithful model of synaptic plasticity, imported into software from neuroscience research"
      ],
      correct: 0,
      exp: "Backprop computes gradients; gradient descent <em>uses</em> them — two separate ideas. The magic is the cost: <b>one backward pass prices every parameter simultaneously</b> (&asymp;2–3&times; a forward pass), by caching forward activations and sweeping the chain rule from the loss backwards. Finite differences would need one full forward pass <em>per parameter</em> — a billion passes for a billion-parameter model."
    },

    {
      type: "mcq",
      q: "A 40-layer fully-connected net with sigmoid activations: the last few layers learn, but the first layers' weights barely move. Most likely cause?",
      opts: [
        "The learning rate is far too high for the early layers, whose gradients explode and get clipped down to nothing",
        "Overfitting is concentrated in the early layers, which memorized the data and so stopped needing any updates",
        "The first layers simply hold too few parameters to express anything, so the optimizer leaves them alone",
        "Gradient factors multiply through depth — sigmoid slopes cap at 0.25, so 40 layers crush the signal"
      ],
      correct: 3,
      exp: "The chain rule multiplies one Jacobian per layer; with \\(|\\sigma'| \\le 0.25\\), forty layers give a factor up to \\(0.25^{40}\\) — effectively zero. <b>Vanishing gradients are an architecture problem, fixed by architecture</b>: ReLU-family activations (slope 1), residual connections (gradient highways), and normalization. That trio is precisely why 100-layer transformers train at all."
    },

    {
      type: "numeric",
      q: "Targets \\(y = [3,\\, -0.5,\\, 2,\\, 7]\\), predictions \\(\\hat{y} = [2.5,\\, 0,\\, 2,\\, 8]\\). Compute the mean squared error \\(\\frac{1}{n}\\sum_i (y_i - \\hat{y}_i)^2\\).",
      answer: 0.375,
      tol: 0.02,
      unit: "",
      exp: "Residuals: \\(0.5,\\, -0.5,\\, 0,\\, -1\\). Squares: \\(0.25 + 0.25 + 0 + 1 = 1.5\\). Mean over 4: <b>0.375</b>. Notice the single error of 1 contributes two-thirds of the entire loss — the squaring-amplifies-outliers effect from drill 1, now in numbers."
    },

    {
      type: "kata",
      q: "<b>KATA — implement MSE.</b> Fill in <code>mse(y, yhat)</code> using numpy (vectorized — no Python loops needed). The grader appends asserts using <code>np.isclose</code> and prints <code>ALL TESTS PASSED</code> on success.",
      starter: [
        "import numpy as np",
        "",
        "def mse(y, yhat):",
        "    # Mean of squared residuals: mean((y - yhat)^2).",
        "    # Replace the ... and return a scalar.",
        "    ..."
      ].join("\n"),
      tests: [
        "y_t = np.array([3.0, -0.5, 2.0, 7.0])",
        "p_t = np.array([2.5, 0.0, 2.0, 8.0])",
        "assert np.isclose(mse(y_t, p_t), 0.375), \"expected 0.375, got %r\" % (mse(y_t, p_t),)",
        "assert np.isclose(mse(np.zeros(5), np.zeros(5)), 0.0), \"perfect predictions must score 0.0\"",
        "y2 = np.array([1.0, 2.0, 3.0])",
        "assert np.isclose(mse(y2, y2 + 2.0), 4.0), \"a constant offset of 2 must score 4.0\"",
        "print(\"ALL TESTS PASSED\")"
      ].join("\n"),
      solution: [
        "import numpy as np",
        "",
        "def mse(y, yhat):",
        "    return np.mean((y - yhat) ** 2)"
      ].join("\n"),
      exp: "One line: <code>return np.mean((y - yhat) ** 2)</code>. The point is the <b>vectorized habit</b>: subtraction, squaring and the mean all broadcast over the whole array at C speed. Every loss you'll ever implement — cross-entropy included — follows this shape: elementwise transform, then a reduction."
    },

    {
      type: "kata",
      q: "<b>KATA — one gradient-descent step.</b> Model \\(\\hat{y} = w x\\), loss \\(L = \\mathrm{mean}((wx - y)^2)\\). Compute the gradient \\(dL/dw\\) at the current \\(w\\), then take one step. The tests check both values.",
      starter: [
        "import numpy as np",
        "",
        "x = np.array([1.0, 2.0, 3.0])",
        "y = np.array([2.0, 4.0, 6.0])   # ground truth: y = 2x",
        "w  = 0.0                        # current weight",
        "lr = 0.1                        # learning rate",
        "",
        "# 1) grad  = dL/dw = 2 * mean((w*x - y) * x)",
        "# 2) w_new = one gradient-descent step from w",
        "grad  = ...",
        "w_new = ..."
      ].join("\n"),
      tests: [
        "assert np.isclose(grad, -56.0/3.0), \"grad: expected %.4f, got %r\" % (-56.0/3.0, grad)",
        "assert np.isclose(w_new, 28.0/15.0), \"w_new: expected %.4f, got %r\" % (28.0/15.0, w_new)",
        "print(\"ALL TESTS PASSED\")"
      ].join("\n"),
      solution: [
        "import numpy as np",
        "",
        "x = np.array([1.0, 2.0, 3.0])",
        "y = np.array([2.0, 4.0, 6.0])",
        "w  = 0.0",
        "lr = 0.1",
        "",
        "grad  = 2 * np.mean((w*x - y) * x)",
        "w_new = w - lr * grad"
      ].join("\n"),
      exp: "<code>grad = 2 * np.mean((w*x - y) * x)</code> evaluates to \\(-56/3 \\approx -18.67\\); then <code>w_new = w - lr * grad</code> gives \\(1.8\\overline{6}\\). One step recovers 93% of the way to the true \\(w = 2\\) — because this loss is a perfect quadratic bowl. <b>The negative gradient says 'increase w'; the step size says how much to trust it.</b> Real losses are not bowls, which is the entire drama of deep learning optimization."
    },

    {
      type: "kata",
      q: "<b>KATA — numerically stable softmax.</b> Implement <code>softmax(x)</code> for a 1-D numpy array. The naive \\(e^{x_i} / \\sum_j e^{x_j}\\) overflows for large logits — subtract \\(\\max(x)\\) first (the result is mathematically identical). Tests check the values, shift-invariance, and that logits of 1000 don't produce NaN.",
      starter: [
        "import numpy as np",
        "",
        "def softmax(x):",
        "    # Numerically stable softmax over a 1-D array:",
        "    # subtract max(x) before exponentiating, then normalize.",
        "    ..."
      ].join("\n"),
      tests: [
        "out = softmax(np.array([1.0, 2.0, 3.0]))",
        "ref = np.array([0.09003057, 0.24472847, 0.66524096])",
        "assert np.allclose(out, ref, atol=1e-6), \"softmax([1,2,3]) wrong: %r\" % (out,)",
        "assert np.isclose(np.sum(out), 1.0), \"probabilities must sum to 1\"",
        "a = np.array([0.5, -1.0, 3.0])",
        "assert np.allclose(softmax(a), softmax(a + 100.0)), \"must be shift-invariant: softmax(x) == softmax(x + c)\"",
        "big = softmax(np.array([1000.0, 1000.0]))",
        "assert np.all(np.isfinite(big)) and np.allclose(big, [0.5, 0.5]), \"naive exp overflows at logit 1000 — subtract the max\"",
        "print(\"ALL TESTS PASSED\")"
      ].join("\n"),
      solution: [
        "import numpy as np",
        "",
        "def softmax(x):",
        "    z = x - np.max(x)",
        "    e = np.exp(z)",
        "    return e / e.sum()"
      ].join("\n"),
      exp: "Subtracting the max multiplies numerator and denominator by the same \\(e^{-\\max(x)}\\), so the math is untouched — but the largest exponent becomes \\(e^0 = 1\\) and nothing overflows. <b>Shift-invariance is the property; max-subtraction is the exploit.</b> Every production softmax — attention scores included (Vol II, EQ 3.2) — does exactly this, which is also why the failing 1000-logit test is the one that catches naive implementations."
    }
  ]
};
