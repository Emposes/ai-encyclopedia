/* ============================================================
   THE GYM — DECK: VOL III PROMPT ENGINEERING
   10 scenario MCQs — pick the highest-leverage fix
   ============================================================ */
window.AIE_DECKS = window.AIE_DECKS || {};
window.AIE_DECKS.prompting = {
  id: "prompting",
  vol: "VOL III — PROMPT ENGINEERING",
  title: "Prompting Drills",
  desc: "Ten production scenarios: broken scaffolds, biased few-shot sets, drunk judges, JSON that won't parse. Pick the highest-leverage fix.",
  items: [

    {
      type: "mcq",
      q: "A teammate's system prompt is one 900-word paragraph mixing persona, tone rules, output format, and twelve edge-case policies. The model reliably follows about half of it. Highest-leverage fix?",
      opts: [
        "Paste the paragraph twice so every rule gets seen more often",
        "Raise the temperature so the model explores more interpretations of the rules",
        "Restructure into labeled, delimited sections — role, hard constraints, output format, examples — and state the two or three non-negotiables explicitly and separately",
        "Move the whole paragraph from the system prompt into the user message"
      ],
      correct: 2,
      exp: "Models track <b>sectioned, scannable structure</b> far better than prose soup — delimiters and headers act as attention anchors. Equally important: twelve co-equal policies means no policy is salient. Promote the few that actually matter to explicit MUST-level constraints and demote the rest. Repetition (option A) inflates tokens without adding structure; it treats a parsing problem as a volume problem."
    },

    {
      type: "mcq",
      q: "A sentiment-classification prompt carries six few-shot examples — all labeled <em>positive</em>, because those were easiest to find. In production it over-predicts positive. The fix?",
      opts: [
        "Balance the example labels and shuffle their order — few-shot examples teach the output prior, not just the format",
        "Add three more positive examples so the format is unmistakable",
        "Set temperature to 0 for deterministic outputs",
        "Append “be objective and unbiased” to the instructions"
      ],
      correct: 0,
      exp: "Few-shot conditioning is implicit distribution-fitting: the model infers <em>what answers usually look like</em>, including the label frequencies — majority-label bias and recency bias (the last example pulls hardest) are well documented in the calibration literature. Temperature 0 makes the bias <em>deterministic</em>, not absent. Balance the labels, vary the order, and ideally end on a neutral-format example."
    },

    {
      type: "mcq",
      q: "You provide five beautifully reasoned few-shot examples. Outputs are indeed well reasoned — but in the wrong structure. Looking closer, each of your five examples is formatted differently. The lesson?",
      opts: [
        "Five examples is too few; reliable structure needs at least ten",
        "Few-shot teaches surface format at least as strongly as content — make examples structurally identical, each ending in exactly the output shape you want",
        "The model is too small to maintain formatting and reasoning simultaneously",
        "Formatting must be specified in the system prompt; examples cannot carry it"
      ],
      correct: 1,
      exp: "Format imitation is the most robust few-shot effect — models copy the <em>shape</em> of demonstrations even when they ignore their logic. Five inconsistent examples teach “format is negotiable.” Make every example identical in skeleton, and remember the final example dominates via recency. One consistent example often beats five inconsistent ones."
    },

    {
      type: "mcq",
      q: "Single chain-of-thought gets multi-step word problems right ~70% of the time, and the errors look scattered — different wrong answers each run, no systematic pattern. Cheapest accuracy lever, same model?",
      opts: [
        "Set temperature to 0 and commit to the single most likely reasoning path",
        "Add “think very carefully, this is important” to the prompt",
        "Fine-tune on a corpus of solved word problems",
        "Self-consistency: sample ~9 chains at temperature ≈ 0.7 and majority-vote the final answer"
      ],
      correct: 3,
      exp: "Scattered, decorrelated errors are the precondition self-consistency exploits: if each chain is right 70% of the time and wrong <em>differently</em>, the vote is right far more often — gains of 10–20 points on math benchmarks are typical. Costs k&times; tokens, and requires a discrete, comparable final answer to vote on. Temperature 0 locks in one path's mistakes; that's the opposite move."
    },

    {
      type: "mcq",
      q: "Your pairwise LLM-judge eval has a problem: when you swap which answer is shown first, the verdict flips in 30% of comparisons. The fix?",
      opts: [
        "Use a larger judge model and trust it",
        "Run every comparison in both orders — count a win only when the verdicts agree, otherwise score a tie",
        "Always put the baseline answer first for consistency",
        "Lower the judge's temperature to zero"
      ],
      correct: 1,
      exp: "Position bias is one of the best-documented judge pathologies (the MT-Bench paper measured it directly): judges systematically favor one slot regardless of content. Order-swapping with agreement-gating is the standard mitigation; randomizing order merely <em>spreads</em> the bias evenly rather than removing noise. Always-baseline-first (option C) bakes the bias into your metric. Temperature 0 makes a biased verdict repeatable."
    },

    {
      type: "mcq",
      q: "Same eval, new pathology: the judge consistently scores longer answers higher, even when the extra words are padding. Best mitigation?",
      opts: [
        "Truncate all answers to identical length before judging",
        "Have the model being evaluated also serve as the judge — it knows its own style",
        "Give the judge a rubric of explicit criteria scored separately, instruct that unsupported padding lowers the score, and use length-controlled comparisons",
        "Raise the judge's temperature so length matters less"
      ],
      correct: 2,
      exp: "Verbosity bias is strong enough that leaderboards built length-controlled variants (AlpacaEval-LC) specifically to cancel it. Rubrics force the judge to commit to <em>which</em> qualities scored, exposing length-driven inflation. Truncation destroys legitimately better long answers, and option B trades one bias for a worse one — <b>self-preference bias</b>, where judges favor their own generations."
    },

    {
      type: "mcq",
      q: "A pipeline needs strict JSON. The prompt pleads “ALWAYS respond with valid JSON” — capitalized, three times. It still breaks ~2% of the time and kills the parser. Best fix?",
      opts: [
        "Plead a fourth time, with stronger wording and an example of the consequences",
        "Lower temperature to 0 — determinism implies validity",
        "Catch parse failures and silently return an empty object",
        "Use the API's structured-output / constrained-decoding mode (or a tool-call schema) so invalid tokens cannot be sampled; keep one retry-with-error as fallback"
      ],
      correct: 3,
      exp: "The reliability ladder for structured output: <b>constrained decoding &gt; tool/function schema &gt; few-shot with prefill &gt; instructions &gt; begging</b>. Grammar-constrained sampling masks invalid tokens at generation time, making malformed JSON impossible rather than unlikely. At 50K calls/day, 2% is a thousand daily failures — and temperature 0 just makes them reproducible."
    },

    {
      type: "mcq",
      q: "“Do NOT mention the competitor. Do NOT apologize. Do NOT use bullet points.” The output mentions the competitor in sentence one. Highest-leverage rewrite?",
      opts: [
        "State positively what the model should do — “discuss only our product; write flowing prose paragraphs” — reserving negation for the one or two constraints that truly need it",
        "Move all three prohibitions to the very top of the system prompt",
        "Repeat each prohibition at the start and end of the prompt",
        "Add a threatened penalty: “if you mention the competitor, the response is invalid”"
      ],
      correct: 0,
      exp: "The pink-elephant problem: to obey “don't mention X,” the model must represent X, which primes generating it — negated instructions measurably underperform positive ones. Positive specification constrains the output space directly instead of flagging a hole in it. Keep negative constraints for genuine red lines, few enough to stay salient — and enforce hard bans with output filters, not prose."
    },

    {
      type: "mcq",
      q: "A 40K-token RAG prompt: instructions on top, thirty retrieved documents, and one critical compliance rule sitting around token 20,000. The rule is routinely ignored. The fix?",
      opts: [
        "Switch to a model with a 10× larger context window",
        "Move the rule out of the middle — restate it at the very end (or top) of the prompt; recall across long contexts is U-shaped and middles get lost",
        "Mark the rule with “CRITICALLY IMPORTANT” where it stands",
        "Lower the temperature so the model reads more carefully"
      ],
      correct: 1,
      exp: "“Lost in the middle” is an empirical regularity: retrieval quality is strong at the context's start and end and sags in between — and a bigger window inherits the same U-shape, just longer. Position <em>is</em> salience. Put load-bearing constraints at the edges, restate them after long evidence blocks, and prune retrieval: ten relevant documents beat thirty mediocre ones twice over."
    },

    {
      type: "mcq",
      q: "The brief reads: “Make it creative but professional, detailed but concise, simple but comprehensive.” Every output is mush. Highest-leverage fix?",
      opts: [
        "Raise temperature for the creative half, then lower it for the professional half",
        "Ask the model to first define each adjective, then write to its own definitions",
        "Replace the adjectives with a concrete spec — audience, length budget, one or two gold examples — plus an explicit priority order for when goals conflict",
        "Generate ten candidates and hand-pick the least mushy"
      ],
      correct: 2,
      exp: "Three contradictory adjective pairs average out to the safest possible output — mush is the <em>correct</em> solution to an underdetermined spec. Concrete artifacts beat abstract qualities: a length budget operationalizes “concise,” a gold example operationalizes everything at once (it's few-shot in disguise), and a priority order resolves conflicts you couldn't anticipate. Option D outsources specification to your own taste, one sample at a time, forever."
    }
  ]
};
