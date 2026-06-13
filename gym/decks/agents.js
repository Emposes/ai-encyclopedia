/* ============================================================
   THE GYM — DECK: VOL IV AGENT ENGINEERING
   8 MCQ · 2 numeric (compounding & pass@k) · 1 kata
   MCQ options are length-balanced (±25% within each item) and the
   engine shuffles their order at render time — read, don't meta-game.
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.agents = {
  id: "agents",
  vol: "VOL IV — AGENT ENGINEERING",
  title: "Agent Engineering Drills",
  desc: "Context budgets, MCP, harness design, stop conditions, topologies — and the compounding math that decides whether your agent survives 25 steps.",
  items: [

    {
      type: "mcq",
      q: "An agent has a 200K window: system prompt 8K, tool schemas 17K — and after sixty tool calls the transcript fills 150K and the model starts forgetting decisions it made an hour ago. Best lever?",
      opts: [
        "Swap to a 1M-context model and keep appending — the budget pressure vanishes for another 850K tokens of headroom",
        "Compact the transcript: summarize stale tool output, keep the live plan verbatim, spill durable facts to files",
        "Reclaim the 8K system prompt by trimming it — fixed overhead is the one slice of the budget you fully control",
        "Raise sampling temperature so the model reasons more loosely over the older, half-decayed slices of context"
      ],
      correct: 1,
      exp: "Context is a <b>budget</b>: fixed overhead (system + schemas) plus working memory that grows every step — and you pay to reprocess all of it on every call while attention quality degrades over distance. A 1M window defers the cliff, 10&times;'s the per-step bill, and still rots in the middle. Compaction plus externalized state (plans and facts in files, not transcript) is how production agents run long."
    },

    {
      type: "mcq",
      q: "MCP — the Model Context Protocol — standardizes:",
      opts: [
        "The inter-agent message bus agents use to delegate, vote, and pass results inside multi-agent orchestration",
        "A portable serialization format for model weights, so trained checkpoints move cleanly across ML frameworks",
        "How hosts discover and invoke external tool servers — one open protocol instead of N×M bespoke integrations",
        "GPU-to-GPU collective communication during distributed inference, standardizing tensor-parallel sync"
      ],
      correct: 2,
      exp: "MCP is a client–server protocol on the <em>application</em> side: servers expose tools, resources, and prompts; any MCP-speaking host (IDE, chat app, agent harness) can use any of them — the USB-C analogy is apt. It complements rather than replaces the model's native tool-calling API: the model still emits tool calls; MCP standardizes where they land and what's available to discover."
    },

    {
      type: "mcq",
      q: "Your agent has 45 fine-grained tools — <code>get_user</code>, <code>get_user_email</code>, <code>get_user_name</code>, … — and keeps choosing the wrong one. Better design?",
      opts: [
        "Consolidate into fewer task-level tools with sharp names and rich, well-scoped parameter schemas",
        "Keep all 45 but write far more thorough descriptions, so the model can finally tell the getters apart",
        "Add a meta-tool that recommends which of the 45 to call, splitting tool selection cleanly from execution",
        "Group related tools under shared name prefixes so list adjacency nudges the model toward the right neighbor"
      ],
      correct: 0,
      exp: "Tool-selection error grows with catalog size, and near-duplicate tools are the worst case — the model must distinguish entries that differ by a suffix. Forty-five schemas also bloat the fixed context bill (drill 1). Design tools at the <b>altitude of intent</b>: one <code>get_user(fields=…)</code> beats five getters. More documentation on a bloated catalog raises cost without removing branches."
    },

    {
      type: "mcq",
      q: "Your coding agent needs shell access. The harness principle that keeps this safe:",
      opts: [
        "A carefully written system prompt instructing the model to stay cautious around destructive commands",
        "Block all execution outright and have the model emit shell commands for a human operator to review and run",
        "Run the agent loop as root so permission errors never stall or derail a long autonomous working session",
        "Tiered sandbox autonomy: unrestricted reads, workspace-scoped writes, human approval for irreversible acts"
      ],
      correct: 3,
      exp: "Safety lives in the <b>harness, not the prompt</b> — instructions can be ignored or injected-around; a sandbox boundary can't. Tier actions by blast radius and reversibility: free reads, workspace-scoped writes, gated escalations. Emit-only throws away agent value to buy safety the sandbox provides anyway; root maximizes blast radius precisely where errors are costliest."
    },

    {
      type: "mcq",
      q: "An agent loops for 40 minutes: edit → run tests → same failure → near-identical edit → same failure… What was missing from the loop design?",
      opts: [
        "A more detailed system prompt explaining the codebase, so edits stop missing the real root cause",
        "Explicit stop conditions: resource budget caps plus no-progress detection that forces a strategy change",
        "A bigger context window, so the agent can recall and rule out every one of its earlier failed edits",
        "Higher temperature on the retries, so successive edits diversify instead of converging on the same patch"
      ],
      correct: 1,
      exp: "“The model will realize it's stuck” is not a stop condition. Production loops bound every resource (steps, tokens, wall-clock, spend) and track a <b>progress signal</b> — repeated identical errors, oscillating edits, no new files touched — that triggers a strategy switch, checkpoint rollback, or human escalation. Termination is a harness guarantee, designed before the loop runs, never an emergent model behavior."
    },

    {
      type: "mcq",
      q: "The task: summarize 300 documents — no document depends on any other — then merge the results. Best topology?",
      opts: [
        "A council of agents that debates every document until consensus filters out individual reading mistakes",
        "One agent reading all 300 in sequence, accumulating a single context that has seen every document",
        "Orchestrator–worker: fan out parallel workers, one clean isolated context per document, then merge",
        "A swarm sharing one scratchpad, each agent grabbing documents opportunistically until the pile is empty"
      ],
      correct: 2,
      exp: "Match topology to the <b>dependency structure</b>. Independent subtasks are embarrassingly parallel: fan-out gives each worker a fresh, focused context (no 300-document rot), runs wall-clock-parallel, and isolates failures to single documents. Sequential burns the context budget for nothing; council multiplies cost on a task with no judgment conflict; swarm pays coordination overhead where zero coordination is needed."
    },

    {
      type: "mcq",
      q: "Per-step success of 98% sounds excellent. Why do 50-step agent tasks still fail roughly half the time, and what helps most?",
      opts: [
        "Success compounds multiplicatively, 0.98^50 ≈ 0.36 — so shorten the chain and add verified checkpoints",
        "Long sessions degrade attention over distance, so schedule periodic context resets to keep the model fresh",
        "The 2% errors cluster near the end of long tasks, so a stronger final review pass catches most failures",
        "Most failures are infrastructure flakes, so wrapping each tool call in retries recovers the lost progress"
      ],
      correct: 0,
      exp: "Independent 2% step-error compounds to 64% task success at 20 steps, 36% at 50. Two levers dominate: <b>shorten the chain</b> (better tools, bigger verified strides) and <b>checkpoint with verification</b> — a checked-green milestone caps how far any error propagates, turning one 50-step chain into five 10-step segments that each only need local success. A final review inspects the wreckage; checkpoints prevent it."
    },

    {
      type: "mcq",
      q: "Your eval reports pass@1 = 40% but pass@8 = 85% for the same model on the same tasks. The honest interpretation:",
      opts: [
        "The benchmark is broken — one model cannot honestly report two scores that far apart on identical tasks",
        "The model can solve ~85% of tasks but is unreliable per try — gold only if a verifier picks winners",
        "Quote 85% — repeated sampling surfaces the true capability that single noisy attempts systematically hide",
        "Quote 40% — the pass@8 figure is just statistical noise from re-rolling until something finally sticks"
      ],
      correct: 1,
      exp: "pass@k is the probability that <em>at least one</em> of k samples succeeds, so it rises with k by construction — no contradiction. The 45-point gap is the <b>capability–reliability gap</b>, and it's recoverable headroom <em>only if</em> verification is cheap (tests, compilers, checkable answers). Report the number matching deployment: verifier-in-the-loop ships pass@8; single-shot UX ships pass@1."
    },

    {
      type: "numeric",
      q: "Compounding. An agent chain has \\(n = 25\\) sequential steps, each independently succeeding with probability \\(p = 0.97\\). Whole-task success is \\(P = p^n\\). Express as a percentage.",
      answer: 46.7,
      tol: 0.05,
      unit: "%",
      exp: "\\(0.97^{25} \\approx 0.467\\) — a 3% per-step error rate turns 25 steps into a <b>coin flip</b>. The exponent is merciless in both directions: cut the chain to 12 steps and success jumps to 69%; push per-step reliability to 0.99 and 25 steps yields 78%. Step count and step reliability dominate every other design choice you will make."
    },

    {
      type: "numeric",
      q: "pass@k estimator. You drew \\(n = 10\\) samples; \\(c = 3\\) passed. The unbiased estimator is \\(\\text{pass@}k = 1 - \\binom{n-c}{k}\\big/\\binom{n}{k}\\). Compute pass@2.",
      answer: 0.533,
      tol: 0.05,
      unit: "",
      exp: "\\(1 - \\binom{7}{2}/\\binom{10}{2} = 1 - 21/45 \\approx 0.533\\). Why not the naive \\(1-(1-0.3)^2 = 0.51\\)? Because drawing 2 from your 10 <em>without replacement</em> isn't independent sampling — the combinatorial form (from the Codex paper) is unbiased for small n. The gap matters exactly where you work: small sample budgets on expensive evals."
    },

    {
      type: "kata",
      q: "<b>KATA — the pass@k estimator.</b> Implement <code>pass_at_k(n, c, k)</code> — the unbiased estimator from the Codex paper: \\(1 - \\binom{n-c}{k}/\\binom{n}{k}\\), where \\(n\\) samples were drawn and \\(c\\) passed. Use <code>math.comb</code>. Mind the edges: \\(c = 0\\) must give 0.0 and \\(c = n\\) must give 1.0 — check whether the formula already handles them.",
      starter: [
        "from math import comb",
        "",
        "def pass_at_k(n, c, k):",
        "    # Unbiased pass@k estimator:",
        "    #   1 - C(n - c, k) / C(n, k)",
        "    # math.comb(a, b) returns 0 when b > a — does that save you",
        "    # any special-casing?",
        "    ..."
      ].join("\n"),
      tests: [
        "v = pass_at_k(10, 3, 2)",
        "assert abs(v - (1 - 21/45)) < 1e-9, \"pass@2, n=10, c=3: expected 0.5333..., got %r\" % (v,)",
        "assert pass_at_k(10, 0, 5) == 0.0, \"c = 0 (nothing passed) must give exactly 0.0\"",
        "assert pass_at_k(10, 10, 1) == 1.0, \"c = n (everything passed) must give exactly 1.0\"",
        "assert abs(pass_at_k(200, 10, 1) - 0.05) < 1e-9, \"pass@1 must equal the plain pass rate c/n\"",
        "assert pass_at_k(10, 3, 10) == 1.0, \"k = n draws every sample, so any pass guarantees success\"",
        "print(\"ALL TESTS PASSED\")"
      ].join("\n"),
      solution: [
        "from math import comb",
        "",
        "def pass_at_k(n, c, k):",
        "    return 1.0 - comb(n - c, k) / comb(n, k)"
      ].join("\n"),
      exp: "One line covers every edge: <code>1.0 - comb(n - c, k) / comb(n, k)</code>. When \\(c = 0\\) the ratio is 1 → 0.0; when \\(k &gt; n - c\\) (including \\(c = n\\)), <code>comb</code> returns 0 → 1.0. <b>The combinatorial form exists because sampling k from your n is without replacement</b> — the naive \\(1-(1-c/n)^k\\) overestimates at small n, which is exactly the regime where eval samples are expensive."
    }
  ]
};
