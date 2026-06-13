/* ============================================================
   THE GYM — DECK: VOL III PROMPT KATAS
   7 write-the-prompt katas. The learner writes a real prompt;
   tier 1 grades it instantly against the five anchors (role /
   context / format / constraints / examples), tier 2 optionally
   sends it to Claude as a strict examiner (BYOK). Every kata
   ships a model solution — the editorial.

   checks.* are case-insensitive regex strings that EXTEND the
   engine's built-in anchor detectors (engine matches built-in OR
   any of these). checks.examples === null marks katas where a
   worked example genuinely doesn't apply: auto-pass, "n/a here".
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.promptkata = {
  id: "promptkata",
  vol: "VOL III",
  title: "Prompt Katas",
  desc: "Write the prompt. Get graded. Compare with the editorial.",
  items: [

    /* ---------- 1 · POLICY EXTRACTION — THE REFUSAL TRAP ---------- */
    {
      type: "prompt",
      title: "POLICY EXTRACTION — THE REFUSAL TRAP",
      scenario: "Legal just shipped a revised refund policy, and your support team needs it as structured macro content by end of day. The excerpt below is everything you have — and the brief from your manager asks for five fields: refund window, eligible plans, processing time, chargeback handling, escalation contact. Read the excerpt carefully: it does not cover everything the brief asks for.",
      source: [
        "REFUND POLICY — EXCERPT (REV 2026-04)",
        "2.1 Self-serve plans (Starter, Pro) may request a full refund",
        "    within 14 calendar days of the charge.",
        "2.2 Enterprise contracts follow the refund terms in their MSA;",
        "    self-serve terms do not apply.",
        "2.3 Approved refunds are returned to the original payment",
        "    method within 5–10 business days."
      ].join("\n"),
      task: "Write a prompt that extracts all five fields into a fixed structure — without letting the model invent the two fields the excerpt never mentions.",
      checks: {
        role: ["support", "operations", "analyst", "policy specialist"],
        context: ["excerpt", "policy below", "rev 2026", "2\\.1", "provided policy"],
        format: ["table", "field", "json", "two.column", "label", "list"],
        constraints: ["not specified", "not in the excerpt", "do not (guess|invent|infer|assume)", "missing"],
        examples: null
      },
      anchorHints: {
        role: "Open with a role — “You are a support-operations analyst…” — it sets the register and the caution level.",
        context: "Bind the model to the source: “using ONLY the policy excerpt below.” Its world must end at §2.3.",
        format: "Name all five fields and a fixed shape (table or JSON). Loose prose can't be pasted into a support macro.",
        constraints: "License the refusal — “if a field is not in the excerpt, write NOT SPECIFIED; do not infer.” The two missing fields are the trap.",
        examples: "A fixed field list plus a NOT SPECIFIED rule pins the output tighter than a worked example would."
      },
      solution: [
        "You are a support-operations analyst preparing macro content for a",
        "customer-support team. Accuracy beats completeness.",
        "",
        "Using ONLY the refund-policy excerpt provided below, extract these",
        "five fields:",
        "",
        "  1. Refund window",
        "  2. Eligible plans",
        "  3. Processing time",
        "  4. Chargeback handling",
        "  5. Escalation contact",
        "",
        "Output a two-column markdown table — FIELD | POLICY — one row per",
        "field, citing the clause (§2.1, §2.2, §2.3) each value comes from.",
        "",
        "If a field is not covered by the excerpt, write exactly",
        "NOT SPECIFIED IN EXCERPT in that row. Do not infer, do not",
        "generalize from other companies' policies, never invent a value.",
        "",
        "POLICY EXCERPT:",
        "REFUND POLICY — EXCERPT (REV 2026-04)",
        "2.1 Self-serve plans (Starter, Pro) may request a full refund",
        "    within 14 calendar days of the charge.",
        "2.2 Enterprise contracts follow the refund terms in their MSA;",
        "    self-serve terms do not apply.",
        "2.3 Approved refunds are returned to the original payment",
        "    method within 5–10 business days."
      ].join("\n"),
      judgeRubric: "The trap: the excerpt never mentions chargeback handling or an escalation contact. Top marks for constraints require the prompt to explicitly license a NOT-SPECIFIED-style refusal for missing fields and to scope the model to the excerpt alone. Format needs all five fields named in a fixed structure a support macro could consume. A prompt that would let the model fabricate the two missing fields must not receive a PASS verdict, whatever else it does well.",
      exp: "<b>The lesson is the trap.</b> A prompt that asks for five fields when the source holds three is testing whether you licensed honesty. “Not specified” must be an allowed answer — otherwise the model fills the gap with confident fiction, because completion is its default behavior."
    },

    /* ---------- 2 · TWO-DOCUMENT DIFF ---------- */
    {
      type: "prompt",
      title: "TWO-DOCUMENT DIFF — RATE-LIMIT DISCREPANCIES",
      scenario: "The internal wiki and the public API docs disagree about rate limits, and a customer just quoted the public page back at support. The PM wants a discrepancy table she can turn into doc-fix tickets — only the fields that actually differ, with both values side by side and a call on which document is more current.",
      source: [
        "DOC A — internal wiki (updated 2026-05-02)",
        "  burst limit: 120 req/min per key",
        "  daily cap:   50,000 req",
        "  429 retry:   exponential backoff, base 2 s",
        "",
        "DOC B — public docs (updated 2025-11-18)",
        "  burst limit: 60 req/min per key",
        "  daily cap:   50,000 req",
        "  429 retry:   retry after 60 s, fixed"
      ].join("\n"),
      task: "Write a prompt that produces a table of only the disagreeing fields — both values, plus which doc is newer — and omits everything the documents agree on.",
      checks: {
        role: ["technical writer", "technical.documentation", "docs engineer", "api", "auditor", "editor"],
        context: ["doc a", "doc b", "wiki", "public docs", "two documents"],
        format: ["table", "column", "row"],
        constraints: ["omit", "exclude", "leave out", "agree", "match", "disagree"],
        examples: ["example", "e\\.g\\.", "like this", "row would", "burst limit \\|"]
      },
      anchorHints: {
        role: "“You are a technical-documentation auditor…” — diff work rewards a role wired for precision.",
        context: "Name the two artifacts — DOC A and DOC B, as provided below — so the model compares those and nothing else.",
        format: "Specify the table columns: field, DOC A value, DOC B value, newer source. Column names are load-bearing.",
        constraints: "Say what to leave OUT: rows where the documents agree. A diff that repeats the matches buries the signal.",
        examples: "Sketch one example row (e.g. burst limit | 120/min | 60/min | DOC A) — one worked row disambiguates the whole table."
      },
      solution: [
        "You are a technical-documentation auditor reconciling two sources",
        "that disagree.",
        "",
        "Compare DOC A and DOC B below, field by field. Output a markdown",
        "table with exactly these columns:",
        "",
        "  FIELD | DOC A (internal wiki) | DOC B (public docs) | NEWER SOURCE",
        "",
        "Include ONLY fields where the two documents disagree — omit every",
        "field where they match. Determine NEWER SOURCE from the update",
        "dates in the headers. Do not editorialize about why they differ.",
        "",
        "Example row (format only):",
        "  burst limit | 120 req/min | 60 req/min | DOC A (2026-05-02)",
        "",
        "DOC A — internal wiki (updated 2026-05-02)",
        "  burst limit: 120 req/min per key",
        "  daily cap:   50,000 req",
        "  429 retry:   exponential backoff, base 2 s",
        "",
        "DOC B — public docs (updated 2025-11-18)",
        "  burst limit: 60 req/min per key",
        "  daily cap:   50,000 req",
        "  429 retry:   retry after 60 s, fixed"
      ].join("\n"),
      judgeRubric: "Constraints carry this exercise: the prompt must demand only the disagreeing fields (the daily cap matches and must be excluded) and must require attribution of which document is newer, derivable from the header dates. Format wants named columns. An example row is the natural fifth anchor — credit prompts that show one. FAIL any prompt that would emit all three fields or drop the newer-source call.",
      exp: "<b>Diffs are defined by what they exclude.</b> The matching daily cap is the test: a prompt that doesn't say “only the fields that disagree” gets a table where the one real bug hides between two non-bugs."
    },

    /* ---------- 3 · JSON FORMAT LOCK ---------- */
    {
      type: "prompt",
      title: "FORMAT LOCK — JSON.PARSE OR NOTHING",
      scenario: "You're wiring a model into ticket triage: its output is fed character-for-character into <code>JSON.parse</code>, with no human and no repair step in between. One markdown fence, one trailing comma, one chatty preamble — and the pipeline pages you at 3 a.m. The email below is the first test case.",
      source: [
        "From: dana@velocorp.io",
        "Subject: Charged twice this month??",
        "Hi — invoice #8841 shows two charges of $49 on June 3 and",
        "June 5. I only have one seat. Please fix and refund one.",
        "This is getting urgent, our finance team flags it weekly."
      ].join("\n"),
      task: "Write a prompt that classifies the email into a strict schema — category, urgency, customer_ref, summary — and makes any output other than one parseable JSON object effectively impossible.",
      checks: {
        role: ["triage", "classif", "extraction engine", "backend", "machine", "pipeline"],
        context: ["email", "message below", "invoice", "the ticket"],
        format: ["json", "schema", "object", "key", "double.quote"],
        constraints: ["nothing else", "no markdown", "no fences", "no backticks", "no prose", "no preamble", "no explanation", "valid json", "parseable", "trailing comma"],
        examples: ["example", "input", "output", "\\{\"category\""]
      },
      anchorHints: {
        role: "Frame the model as a machine — “You are a ticket-triage classifier; you output data, not conversation.”",
        context: "Point at the email below as the input being classified, so the schema binds to something concrete.",
        format: "Give the schema with types and allowed values: category from a fixed enum, urgency 1–3, customer_ref, summary.",
        constraints: "Parse-safety is constraints: ONLY the JSON object — no markdown fences, no preamble, no trailing commas, double-quoted keys.",
        examples: "Show one example output object. For format-critical work, a single worked example out-teaches a paragraph of rules."
      },
      solution: [
        "You are a ticket-triage classifier inside an automated pipeline.",
        "Your entire output is passed directly to JSON.parse. You output",
        "data, never conversation.",
        "",
        "Classify the customer email below into exactly this schema:",
        "{",
        "  \"category\": one of \"billing\" | \"bug\" | \"account\" | \"other\",",
        "  \"urgency\": integer 1-3 (3 = blocking or money at risk),",
        "  \"customer_ref\": the invoice or ticket id quoted, else null,",
        "  \"summary\": one factual sentence, max 20 words",
        "}",
        "",
        "Output rules — all hard:",
        "- Return ONLY the JSON object. No markdown fences, no preamble,",
        "  no trailing commas, no comments. Double quotes on every key.",
        "- If a value is unknown, use null. Do not invent identifiers.",
        "",
        "Example output (for a different email):",
        "{\"category\":\"bug\",\"urgency\":2,\"customer_ref\":\"TCK-1042\",\"summary\":\"Export to CSV fails above 10k rows since Tuesday.\"}",
        "",
        "EMAIL:",
        "From: dana@velocorp.io",
        "Subject: Charged twice this month??",
        "Hi — invoice #8841 shows two charges of $49 on June 3 and",
        "June 5. I only have one seat. Please fix and refund one.",
        "This is getting urgent, our finance team flags it weekly."
      ].join("\n"),
      judgeRubric: "This is a format-lock exercise: top marks require a typed schema (enum for category, integer range for urgency), explicit parse-safety constraints (only the object, no fences, no preamble, double quotes), and a null policy for unknowns. An example output object is strong evidence of competence. A prompt that merely says “respond in JSON” scores at most 1 on format and 1 on constraints.",
      exp: "<b>“Respond in JSON” is a wish; a schema plus parse rules is a contract.</b> In production you'd stack constrained decoding on top — but the prompt-level lock is the layer you control everywhere, and the example object is the cheapest reliability you'll ever buy."
    },

    /* ---------- 4 · STYLE TRANSFER — FEW-SHOT ---------- */
    {
      type: "prompt",
      title: "STYLE TRANSFER — TEACH THE VOICE BY EXAMPLE",
      scenario: "Marketing has a house voice for release notes — playful, concrete, zero corporate filler — and they've already converted two bullets by hand. A third raw bullet just landed. Adjective lists (“punchy”, “fun”) have failed at this before; the two finished pairs in front of you are the only spec that has ever worked.",
      source: [
        "PAIR 1",
        "  raw:   Fixed bug where export to CSV failed over 10k rows.",
        "  brand: Exports now glide past 10,000 rows — no more CSV cliffs.",
        "",
        "PAIR 2",
        "  raw:   Added SSO support for Okta and Azure AD.",
        "  brand: One login to rule them all: Okta and Azure AD SSO are live.",
        "",
        "TO CONVERT",
        "  raw:   Reduced dashboard load time by 40% via query caching."
      ].join("\n"),
      task: "Write a prompt that converts the remaining raw bullet into the brand voice — using the two finished pairs as worked input→output examples, not as prose to describe.",
      checks: {
        role: ["copywriter", "brand", "marketing", "editor", "voice"],
        context: ["pair", "to convert", "raw bullet", "finished"],
        format: ["one line", "single (line|bullet|sentence)", "bullet", "output only", "just the"],
        constraints: ["keep (the|every) fact", "preserve", "no emoji", "no hashtags", "exclamation", "under \\d", "intact"],
        examples: ["raw:", "brand:", "input", "output", "example", "pair", "demonstrat"]
      },
      anchorHints: {
        role: "“You are the release-notes copywriter for…” — a voice task deserves a voice-owner role.",
        context: "Reference the provided pairs and the raw bullet below explicitly — the examples are the spec.",
        format: "Ask for exactly one line of output — the converted bullet, nothing else around it.",
        constraints: "Pin what can't change: keep every technical fact (40%, query caching); ban emoji and exclamation-mark pileups.",
        examples: "This is the kata: lay the two pairs out as RAW → BRAND examples and end with the new RAW plus an empty BRAND slot. Few-shot IS the instruction."
      },
      solution: [
        "You are the release-notes copywriter for a developer-tools brand:",
        "playful, concrete, allergic to corporate filler.",
        "",
        "Convert the raw changelog bullet into the brand voice, exactly as",
        "demonstrated by the two finished examples below. Match their",
        "energy, length and structure. Keep every technical fact intact",
        "(numbers, feature names). No emoji, at most one exclamation mark,",
        "and output ONLY the single converted line.",
        "",
        "Example 1",
        "  RAW:   Fixed bug where export to CSV failed over 10k rows.",
        "  BRAND: Exports now glide past 10,000 rows — no more CSV cliffs.",
        "",
        "Example 2",
        "  RAW:   Added SSO support for Okta and Azure AD.",
        "  BRAND: One login to rule them all: Okta and Azure AD SSO are live.",
        "",
        "Now convert:",
        "  RAW:   Reduced dashboard load time by 40% via query caching.",
        "  BRAND:"
      ].join("\n"),
      judgeRubric: "The examples anchor is the whole lesson: top marks require the two finished pairs deployed as explicit input→output demonstrations — ideally ending with the new raw line and an open slot — not paraphrased as style advice. Constraints should preserve the technical facts (40%, query caching) and cap stylistic excess. Score format on whether exactly one output line is demanded. A prompt that describes the voice in adjectives but never shows the pairs caps at 1 on examples.",
      exp: "<b>Show, don't describe.</b> Two consistent worked pairs define a voice better than any adjective stack — and ending the prompt mid-pattern (RAW given, BRAND empty) turns the model's completion instinct into your formatting engine."
    },

    /* ---------- 5 · AUDIENCE SPLIT ---------- */
    {
      type: "prompt",
      title: "AUDIENCE SPLIT — ONE INCIDENT, TWO READERS",
      scenario: "Incident #2219 is resolved, and now it must be narrated twice: the board wants to know what it cost and whether it can recur; the engineering org wants the mechanism and the follow-ups. Same facts, two registers — and any fact that appears in a memo but not in the source is a career risk.",
      source: [
        "INCIDENT #2219 — 2026-06-08",
        "  41 min API outage, EU region only",
        "  cause: expired TLS cert on internal gateway (auto-renew misconfigured)",
        "  impact: 12% of requests failed; 3 enterprise SLAs breached",
        "  fix: cert rotated; renewal alarm added; postmortem scheduled 06-16"
      ].join("\n"),
      task: "Write one prompt that produces both deliverables from the fact sheet: a plain-language board memo (≤120 words, leads with customer/SLA impact) and a technical engineering brief with concrete action items.",
      checks: {
        role: ["chief of staff", "communications", "incident commander", "sre", "comms lead"],
        context: ["incident", "2219", "fact sheet", "facts provided"],
        format: ["two sections", "two parts", "board memo", "engineering brief", "section", "heading", "part 1", "part 2"],
        constraints: ["only the facts", "do not (add|invent|speculate)", "no jargon", "120", "word", "plain language", "same facts"],
        examples: null
      },
      anchorHints: {
        role: "“You are the incident commander writing the comms…” — someone who owns both audiences.",
        context: "Bind both outputs to the incident fact sheet below; nothing in either section that isn't in the facts.",
        format: "Demand two labeled sections with their own rules — BOARD MEMO (≤120 words, plain language, impact first) and ENGINEERING BRIEF (mechanism, action items).",
        constraints: "Same facts, different altitude: ban jargon in the memo, ban speculation in both, cap the memo's length.",
        examples: "The two section specs are themselves the template; worked examples would add little."
      },
      solution: [
        "You are the incident commander for incident #2219, writing the",
        "follow-up communications.",
        "",
        "Using ONLY the incident fact sheet below, produce two sections:",
        "",
        "== BOARD MEMO (max 120 words) ==",
        "Plain language, zero jargon (no “TLS”, no “gateway” — say what",
        "customers felt). Lead with customer and SLA impact, then the cause",
        "in one sentence, then what prevents recurrence. No blame, no",
        "hedging.",
        "",
        "== ENGINEERING BRIEF ==",
        "Precise technical language. Cover: the root-cause chain, why",
        "auto-renew was misconfigured, and a numbered action-item list",
        "including the postmortem date. Flag any open risk the facts imply.",
        "",
        "Both sections must contain the same facts at different altitudes.",
        "Do not add numbers, causes, or commitments that are not in the",
        "fact sheet.",
        "",
        "INCIDENT FACT SHEET:",
        "INCIDENT #2219 — 2026-06-08",
        "  41 min API outage, EU region only",
        "  cause: expired TLS cert on internal gateway (auto-renew misconfigured)",
        "  impact: 12% of requests failed; 3 enterprise SLAs breached",
        "  fix: cert rotated; renewal alarm added; postmortem scheduled 06-16"
      ].join("\n"),
      judgeRubric: "Score format on whether two clearly labeled sections with distinct specs are demanded — a word cap and impact-first ordering for the board, mechanism plus action items for engineering. Constraints: both sections locked to the fact sheet, jargon banned for the board audience, no invented commitments. The reframe is the skill: identical facts, different altitude. A single undifferentiated summary, however good, is a FAIL.",
      exp: "<b>Audience is a parameter, and you set it explicitly.</b> The facts didn't change between the sections — the altitude did. Prompts that name the reader, ban the wrong register, and cap length get two genuinely different documents instead of one compromise."
    },

    /* ---------- 6 · SELF-CRITIQUE LOOP ---------- */
    {
      type: "prompt",
      title: "SELF-CRITIQUE LOOP — DRAFT, THREE PASSES, CONFIDENCE",
      scenario: "One-shot cold emails read like one-shot cold emails. For this LedgerPilot outreach you want the model to do what a good writer does: draft, then tear the draft apart deliberately — three named critique passes — then rewrite, then tell you how much to trust each claim it made. The prompt's job is to demand that whole workflow, not just “an email”.",
      source: [
        "PRODUCT: LedgerPilot — closes the books 4 days faster",
        "  · syncs 40+ ERPs, read-only by default",
        "  · SOC 2 Type II; EU data residency",
        "  · pilot: 6 weeks, no integration fee",
        "PROSPECT: VP Finance, 800-person logistics company,",
        "  posted last week about month-end close pain."
      ].join("\n"),
      task: "Write a prompt that requests: (1) a draft email, (2) three critique passes over it — clarity, evidence, tone — (3) a revised email, (4) a confidence score per factual claim in the final version.",
      checks: {
        role: ["sdr", "sales", "outreach", "copywriter", "writer"],
        context: ["fact sheet", "ledgerpilot", "prospect", "close pain"],
        format: ["step", "pass", "draft", "critique", "revis", "confidence", "labeled", "section", "stage"],
        constraints: ["do not invent", "no claims", "under \\d", "word", "three", "traceable"],
        examples: null
      },
      anchorHints: {
        role: "“You are a senior SDR…” — and one being asked to edit ruthlessly, not just emit.",
        context: "Lock claims to the fact sheet below: product facts and the prospect's stated pain, nothing imported.",
        format: "Spell out the four stages as labeled output sections: DRAFT → CRITIQUE (three named passes) → REVISED → CONFIDENCE table. The workflow is the format.",
        constraints: "Name the three passes (clarity, evidence, tone), cap the email length, and forbid claims absent from the fact sheet.",
        examples: "The staged structure you demand is itself the scaffold; the model fills it."
      },
      solution: [
        "You are a senior SDR writing cold outreach that survives a",
        "skeptical VP's 8-second skim.",
        "",
        "Work ONLY from the fact sheet below. Produce four labeled",
        "sections:",
        "",
        "1. DRAFT — a cold email to the prospect, under 130 words,",
        "   referencing their stated month-end close pain.",
        "2. CRITIQUE — three separate passes over your own draft:",
        "   - CLARITY: can a 9th-grader parse every sentence in one read?",
        "   - EVIDENCE: is every claim traceable to the fact sheet? List",
        "     any that are not.",
        "   - TONE: would a VP Finance smell template? Quote the worst",
        "     line.",
        "3. REVISED — the email rewritten to fix everything the critique",
        "   found, still under 130 words.",
        "4. CONFIDENCE — a table: each factual claim in the revised email,",
        "   the fact-sheet line supporting it, and your confidence (0-100%).",
        "",
        "Do not invent customers, metrics, or integrations that are not in",
        "the fact sheet. If a critique pass finds nothing, say so — do not",
        "manufacture objections.",
        "",
        "FACT SHEET:",
        "PRODUCT: LedgerPilot — closes the books 4 days faster",
        "  · syncs 40+ ERPs, read-only by default",
        "  · SOC 2 Type II; EU data residency",
        "  · pilot: 6 weeks, no integration fee",
        "PROSPECT: VP Finance, 800-person logistics company,",
        "  posted last week about month-end close pain."
      ].join("\n"),
      judgeRubric: "This is a meta-prompting exercise: the prompt must explicitly demand the full generate→critique→revise→confidence pipeline, with the three critique passes named (clarity, evidence, tone) and confidence attached per claim — not as one global number. Credit constraints that lock claims to the fact sheet and cap email length. A prompt that just asks for a good cold email, however eloquently, misses the point and FAILs.",
      exp: "<b>You can rent the editor, not just the writer.</b> Asking for draft → named critique passes → revision → per-claim confidence buys a second and third pass from the same model — and the confidence table tells you exactly which sentence to fact-check before hitting send."
    },

    /* ---------- 7 · CITATION DISCIPLINE ---------- */
    {
      type: "prompt",
      title: "CITATION DISCIPLINE — EVERY CLAIM WEARS ITS ROW",
      scenario: "Three rows of churn data are going into a note for the growth team — and last quarter, someone's “insight” in a similar note turned out to come from a different dataset entirely. New rule: every numeric claim cites the row it came from, and anything the rows can't support doesn't get written. Your prompt enforces the rule.",
      source: [
        "ROW 1 | plan: Starter | Q1 churn: 4.1% | Q2 churn: 6.8%",
        "ROW 2 | plan: Pro     | Q1 churn: 2.3% | Q2 churn: 2.4%",
        "ROW 3 | plan: Team    | Q1 churn: 1.1% | Q2 churn: 3.9%"
      ].join("\n"),
      task: "Write a prompt that produces 3–5 findings from the table where every claim carries a row citation like [R1] — and trends or causes the rows can't support are explicitly off-limits.",
      checks: {
        role: ["analyst", "data", "growth"],
        context: ["row", "table below", "churn data", "r1"],
        format: ["bullet", "finding", "\\[r", "citation", "cite"],
        constraints: ["every (claim|number|finding)", "no (speculation|causes|forecasts|guessing)", "derivable", "supported", "prove"],
        examples: ["example", "e\\.g\\.", "\\[r1\\]", "such as", "like:"]
      },
      anchorHints: {
        role: "“You are a data analyst who treats uncited numbers as bugs…” — the role can carry the discipline.",
        context: "Reference the three rows below as the entire evidence base — R1 to R3; nothing else exists.",
        format: "Ask for 3–5 bullet findings, each ending in its row citation(s) — [R1], or [R1][R3] for comparisons.",
        constraints: "The hard rule: every numeric claim cites a row; no causes, no forecasts, nothing the rows can't prove.",
        examples: "Show one cited finding as a pattern — e.g. “Starter churn rose 2.7 pts quarter over quarter [R1]” — so the citation format is unambiguous."
      },
      solution: [
        "You are a data analyst writing for the growth team. Your standard:",
        "a numeric claim without a citation is a bug.",
        "",
        "Using ONLY the three rows below (cite them as [R1], [R2], [R3]),",
        "write 3-5 bullet findings about churn.",
        "",
        "Rules, all hard:",
        "- Every claim that uses a number ends with its row citation —",
        "  comparisons cite both rows, e.g. “Team churn more than tripled",
        "  while Pro held flat [R2][R3].”",
        "- Derived numbers (deltas, ratios) are fine, but only from these",
        "  rows, and still cited.",
        "- No causes, no forecasts, no segment guesses — if the rows can't",
        "  prove it, it does not appear.",
        "- If the data supports fewer than 3 findings, write fewer.",
        "",
        "DATA:",
        "ROW 1 | plan: Starter | Q1 churn: 4.1% | Q2 churn: 6.8%",
        "ROW 2 | plan: Pro     | Q1 churn: 2.3% | Q2 churn: 2.4%",
        "ROW 3 | plan: Team    | Q1 churn: 1.1% | Q2 churn: 3.9%"
      ].join("\n"),
      judgeRubric: "Grade constraints hardest: every numeric claim must be required to carry a row citation, and speculation beyond the rows (causes, forecasts, seasonality) must be explicitly banned. Format wants 3–5 bullet findings with a defined citation token like [R1]. An example cited finding earns the examples point. A prompt that asks for “insights from this data” without the citation rule is exactly the failure mode this kata exists to kill — FAIL it.",
      exp: "<b>Citations are constraints, not garnish.</b> “Every number ends with its row” gives reviewers an O(1) check per claim — and the ban on causes is what keeps a 3-row table from generating a 3-paragraph theory of churn."
    }
  ]
};
