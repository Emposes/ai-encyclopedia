/* ============================================================
   THE GYM — DECK: VOL IV AGENT ENGINEERING
   8 MCQ · 2 numeric (compounding & pass@k)
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
        "Switch to a 1M-context model and continue as before",
        "Compaction: summarize completed tool results into terse state notes, keep the plan and recent turns verbatim, and persist durable facts to a scratchpad file",
        "Trim the system prompt to reclaim the 8K",
        "Increase temperature so the model reasons more flexibly about old context"
      ],
      correct: 1,
      exp: "Context is a <b>budget</b>: fixed overhead (system + schemas) plus working memory that grows every step — and you pay to reprocess all of it on every call while attention quality degrades over distance. A 1M window defers the cliff, 10&times;'s the per-step bill, and still rots in the middle. Compaction plus externalized state (plans and facts in files, not transcript) is how production agents run long."
    },

    {
      type: "mcq",
      q: "MCP — the Model Context Protocol — standardizes:",
      opts: [
        "The message format models use to talk to each other in multi-agent systems",
        "The serialization format for model weights across frameworks",
        "How a host application discovers and calls external tool/resource servers — one protocol, so N clients × M tools stops requiring N×M custom integrations",
        "GPU-to-GPU communication during distributed inference"
      ],
      correct: 2,
      exp: "MCP is a client–server protocol on the <em>application</em> side: servers expose tools, resources, and prompts; any MCP-speaking host (IDE, chat app, agent harness) can use any of them — the USB-C analogy is apt. It complements rather than replaces the model's native tool-calling API: the model still emits tool calls; MCP standardizes where they land and what's available to discover."
    },

    {
      type: "mcq",
      q: "Your agent has 45 fine-grained tools — <code>get_user</code>, <code>get_user_email</code>, <code>get_user_name</code>, … — and keeps choosing the wrong one. Better design?",
      opts: [
        "Consolidate into fewer, task-level tools with unambiguous names, rich descriptions, and structured parameters — every schema costs context and adds a decision branch",
        "Keep all 45 but document each more thoroughly",
        "Add a tool-selection tool that recommends which tool to call",
        "Alphabetize the tool list so related tools sit together"
      ],
      correct: 0,
      exp: "Tool-selection error grows with catalog size, and near-duplicate tools are the worst case — the model must distinguish entries that differ by a suffix. Forty-five schemas also bloat the fixed context bill (drill 1). Design tools at the <b>altitude of intent</b>: one <code>get_user(fields=…)</code> beats five getters. More documentation on a bloated catalog (option B) raises cost without removing branches."
    },

    {
      type: "mcq",
      q: "Your coding agent needs shell access. The harness principle that keeps this safe:",
      opts: [
        "A carefully written system prompt instructing the model to be cautious",
        "Block all execution and have the model emit commands for a human to run",
        "Run as root so permission errors never interrupt the loop",
        "Tiered autonomy in a sandbox: reads are cheap and free, writes are scoped to a workspace, and irreversible or external actions — deploys, payments, deletes — require explicit human approval"
      ],
      correct: 3,
      exp: "Safety lives in the <b>harness, not the prompt</b> — instructions can be ignored or injected-around; a sandbox boundary can't. Tier actions by blast radius and reversibility: free reads, workspace-scoped writes, gated escalations. Option B throws away agent value to buy safety the sandbox provides anyway; option C maximizes blast radius precisely where errors are costliest."
    },

    {
      type: "mcq",
      q: "An agent loops for 40 minutes: edit → run tests → same failure → near-identical edit → same failure… What was missing from the loop design?",
      opts: [
        "A more detailed system prompt explaining the codebase",
        "Explicit stop conditions: budget caps on steps/tokens/time, plus no-progress detection — the same error twice means change strategy or escalate, not retry",
        "A bigger context window to remember earlier attempts",
        "Higher temperature to diversify the edits"
      ],
      correct: 1,
      exp: "“The model will realize it's stuck” is not a stop condition. Production loops bound every resource (steps, tokens, wall-clock, spend) and track a <b>progress signal</b> — repeated identical errors, oscillating edits, no new files touched — that triggers a strategy switch, checkpoint rollback, or human escalation. Termination is a harness guarantee, designed before the loop runs, never an emergent model behavior."
    },

    {
      type: "mcq",
      q: "The task: summarize 300 documents — no document depends on any other — then merge the results. Best topology?",
      opts: [
        "A council of agents debating each document until consensus",
        "One agent processing all 300 sequentially in a single long context",
        "Orchestrator–worker: fan out parallel workers, each with a clean context for its document, then a final merge step",
        "A swarm sharing one scratchpad, each agent grabbing documents opportunistically"
      ],
      correct: 2,
      exp: "Match topology to the <b>dependency structure</b>. Independent subtasks are embarrassingly parallel: fan-out gives each worker a fresh, focused context (no 300-document rot), runs wall-clock-parallel, and isolates failures to single documents. Sequential burns the context budget for nothing; council multiplies cost on a task with no judgment conflict; swarm pays coordination overhead where zero coordination is needed."
    },

    {
      type: "mcq",
      q: "Per-step success of 98% sounds excellent. Why do 50-step agent tasks still fail roughly half the time, and what helps most?",
      opts: [
        "Success compounds multiplicatively — \\(0.98^{50} \\approx 0.36\\) — so the highest-leverage fixes are fewer steps and verified checkpoints that stop errors from propagating",
        "Models get fatigued over long sessions; schedule context resets",
        "The 2% errors cluster at the end of tasks, so a stronger final review fixes most failures",
        "Failures are mostly random infrastructure flakes; add retries around every tool call"
      ],
      correct: 0,
      exp: "Independent 2% step-error compounds to 64% task success at 20 steps, 36% at 50. Two levers dominate: <b>shorten the chain</b> (better tools, bigger verified strides) and <b>checkpoint with verification</b> — a checked-green milestone caps how far any error propagates, turning one 50-step chain into five 10-step segments that each only need local success. A final review inspects the wreckage; checkpoints prevent it."
    },

    {
      type: "mcq",
      q: "Your eval reports pass@1 = 40% but pass@8 = 85% for the same model on the same tasks. The honest interpretation:",
      opts: [
        "The benchmark is broken — the two numbers contradict each other",
        "The model knows how to solve ~85% of tasks but is unreliable per attempt — great if a cheap verifier can pick the winner from 8 samples, misleading if users get one shot",
        "Quote 85% as the model's accuracy; that's its true capability",
        "Quote 40%; pass@8 is statistical noise"
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
    }
  ]
};
