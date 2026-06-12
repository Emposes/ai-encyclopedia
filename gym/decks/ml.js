/* ============================================================
   THE GYM — DECK: VOL I FOUNDATIONS
   9 MCQ · 1 numeric · 2 numpy katas
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.ml = {
  id: "ml",
  vol: "VOL I — FOUNDATIONS",
  title: "Foundations Drills",
  desc: "Losses, gradient descent, generalization, k-means, backprop — plus two numpy katas. The bedrock everything else stands on.",
  items: [

    {
      type: "mcq",
      q: "You're predicting house prices and the dataset contains a few mansions with wildly wrong listed prices (label noise). Training with MSE rather than MAE, what should you expect?",
      opts: [
        "MSE and MAE give essentially the same model — both measure error magnitude",
        "The model bends toward the noisy mansions: squaring makes large errors dominate the total loss, and the gradient scales with the error",
        "MAE overfits the mansions because it weights every error equally",
        "MSE ignores outliers because averaging washes them out"
      ],
      correct: 1,
      exp: "<b>Squaring is a choice about whose errors matter.</b> Under MSE an error of 10 costs 100&times; an error of 1, and the gradient \\(2(\\hat{y}-y)\\) grows linearly with the miss — so a few corrupted labels pull the fit hard. MAE's gradient is &plusmn;1 regardless of size, making it robust but non-smooth at zero. Huber loss is the standard compromise: quadratic near zero, linear in the tails."
    },

    {
      type: "mcq",
      q: "Minimizing a clean quadratic bowl with gradient descent, you triple the learning rate. The loss now bounces side to side and <em>grows</em> every step. What's happening?",
      opts: [
        "The optimizer is stuck in a saddle point",
        "Gradients are vanishing — the steps are too small to register",
        "Each update overshoots the minimum and lands higher on the opposite wall; past a critical learning rate this oscillation diverges",
        "The loss surface itself changed because the weights changed"
      ],
      correct: 2,
      exp: "On a quadratic with curvature \\(\\lambda\\), gradient descent converges only if \\(\\eta &lt; 2/\\lambda\\). Just below the limit it oscillates while shrinking; above it, each bounce is bigger than the last — <b>monotonic growth with sign-flipping loss is the classic signature of a too-large learning rate</b>, not a data or architecture problem. The fix is to lower \\(\\eta\\), not to train longer."
    },

    {
      type: "mcq",
      q: "Linear regression with two raw features: square meters (range 0–500) and bathroom count (range 0–5). Vanilla gradient descent zig-zags and converges painfully slowly. Highest-leverage fix?",
      opts: [
        "Standardize the features so the loss contours become roughly circular instead of a stretched ellipse",
        "Run many more iterations — convergence is guaranteed eventually",
        "Switch the loss from MSE to MAE",
        "Use a smaller batch size to add helpful noise"
      ],
      correct: 0,
      exp: "Wildly different feature scales make the loss surface a long thin valley (high condition number). The gradient points <em>across</em> the valley, not along it, so steps ricochet between walls. <b>Normalization is an optimization fix, not just hygiene</b> — it's also why Adam-style per-coordinate scaling and normalization layers matter so much in deep nets."
    },

    {
      type: "mcq",
      q: "Training loss keeps falling. Validation loss fell, bottomed at epoch 12, and has climbed ever since. At epoch 40 the model is best described as:",
      opts: [
        "Underfit — it needs more epochs to converge",
        "Badly initialized — restart with a different seed",
        "Suffering from too low a learning rate",
        "Overfit — it is memorizing training-set specifics that don't transfer; the epoch-12 checkpoint generalizes better than the current one"
      ],
      correct: 3,
      exp: "A widening train/validation gap is the operational definition of overfitting. <b>The best model is not the last one</b> — early stopping (keep the epoch-12 checkpoint) is the cheapest regularizer available. The other levers: more data, augmentation, weight decay, dropout, or a smaller model. Note the diagnosis required <em>both</em> curves; training loss alone tells you nothing about generalization."
    },

    {
      type: "mcq",
      q: "A model scores 34% error on its own training data and 35% on validation; humans manage ~5%. What's the dominant problem, and the fix?",
      opts: [
        "High variance — collect more training data",
        "High bias — the model can't even fit the data it has; increase capacity or train longer",
        "High variance — add dropout and weight decay",
        "Data leakage — validation is contaminated"
      ],
      correct: 1,
      exp: "Train error far above the achievable floor = <b>bias problem</b>; the tiny 1-point train/val gap says variance is fine. More data is useless here — the model already fails on the data it's seen. The bias/variance decision procedure: compare train error to the human/Bayes floor first, then the train→val gap. Fixes ordered by the failing term, not by habit."
    },

    {
      type: "mcq",
      q: "You want the model to automatically zero-out irrelevant features so the result is interpretable. Which regularizer, and why?",
      opts: [
        "L2 — it shrinks weights smoothly to exactly zero",
        "Early stopping — it implicitly removes features",
        "L1 — its penalty gradient stays at constant magnitude \\(\\lambda\\) even for tiny weights, pushing them all the way to zero and producing sparse solutions",
        "Either; L1 and L2 differ only in convergence speed"
      ],
      correct: 2,
      exp: "L2's penalty gradient is proportional to \\(w\\) — as a weight approaches zero the push fades, so weights shrink but <b>almost never reach exactly zero</b>. L1's push is constant, so small weights get driven to the axis. Geometric picture: the L1 constraint ball is a diamond, and optima land on its corners where coordinates are zero. That's lasso = built-in feature selection."
    },

    {
      type: "mcq",
      q: "k-means with k = 2 on two concentric rings carves a useless straight split down the middle. Why is this unavoidable for k-means?",
      opts: [
        "k = 2 is too small — k = 4 would trace the rings",
        "It minimizes within-cluster squared distance to centroids, so every cluster is a convex Voronoi cell — a ring is not convex, so no centroid placement can recover it",
        "It wasn't run for enough iterations to find the rings",
        "It needs labeled examples of each ring to anchor the clusters"
      ],
      correct: 1,
      exp: "Each point joins its <em>nearest centroid</em>, so the partition is always a set of convex cells, whatever k you choose — more centroids just shatters the rings into arcs. <b>The objective defines what 'cluster' means</b>: k-means assumes compact blobs of similar radius. For connectivity-shaped structure use spectral clustering, DBSCAN, or transform features (here: radius from center makes it trivially separable)."
    },

    {
      type: "mcq",
      q: "Backpropagation is best described as:",
      opts: [
        "Reverse-mode automatic differentiation — an ordering of the chain rule that yields the gradient of one scalar loss w.r.t. every parameter in roughly one extra backward pass",
        "A learning algorithm, distinct from gradient descent, that decides how weights should change",
        "Finite-difference estimation: nudge each weight, re-run the forward pass, measure the change",
        "A biologically faithful model of how synapses update"
      ],
      correct: 0,
      exp: "Backprop computes gradients; gradient descent <em>uses</em> them — two separate ideas. The magic is the cost: <b>one backward pass prices every parameter simultaneously</b> (&asymp;2–3&times; a forward pass), by caching forward activations and sweeping the chain rule from the loss backwards. Finite differences would need one full forward pass <em>per parameter</em> — a billion passes for a billion-parameter model."
    },

    {
      type: "mcq",
      q: "A 40-layer fully-connected net with sigmoid activations: the last few layers learn, but the first layers' weights barely move. Most likely cause?",
      opts: [
        "Learning rate too high for the early layers",
        "Overfitting concentrated in the early layers",
        "Too few parameters in the first layers",
        "Gradients shrink as they're multiplied back through layers — sigmoid's slope never exceeds 0.25, so 40 such factors crush the signal toward zero"
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
      exp: "<code>grad = 2 * np.mean((w*x - y) * x)</code> evaluates to \\(-56/3 \\approx -18.67\\); then <code>w_new = w - lr * grad</code> gives \\(1.8\\overline{6}\\). One step recovers 93% of the way to the true \\(w = 2\\) — because this loss is a perfect quadratic bowl. <b>The negative gradient says 'increase w'; the step size says how much to trust it.</b> Real losses are not bowls, which is the entire drama of deep learning optimization."
    }
  ]
};
