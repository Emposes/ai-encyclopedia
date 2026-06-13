/* ============================================================
   THE GYM — DECK: VOL III PROMPT ENGINEERING
   10 scenario MCQs — pick the highest-leverage fix
   MCQ options are length-balanced (±25% within each item) and the
   engine shuffles their order at render time — read, don't meta-game.
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
        "Duplicate the whole paragraph so the rules get attended to twice and survive deep context pressure",
        "Raise the temperature so the model samples more of the paragraph instead of fixating on one subset of rules",
        "Restructure into labeled, delimited sections and state the two or three non-negotiables on their own line",
        "Move the block from the system prompt into the user turn, where instructions carry more decoding weight"
      ],
      correct: 2,
      exp: "Models track <b>sectioned, scannable structure</b> far better than prose soup — delimiters and headers act as attention anchors. Equally important: twelve co-equal policies means no policy is salient. Promote the few that actually matter to explicit MUST-level constraints and demote the rest. Repetition inflates tokens without adding structure; it treats a parsing problem as a volume problem."
    },

    {
      type: "mcq",
      q: "A sentiment-classification prompt carries six few-shot examples — all labeled <em>positive</em>, because those were easiest to find. In production it over-predicts positive. The fix?",
      opts: [
        "Balance the example labels and shuffle their order — few-shot teaches the output prior, not just format",
        "Add three more positive examples so the output format becomes unmistakable and the label mix matters less",
        "Set the temperature to 0 so deterministic decoding strips out the sampling noise that skews predictions",
        "Append “be objective and unbiased” at the end so the instruction overrides whatever the examples imply"
      ],
      correct: 0,
      exp: "Few-shot conditioning is implicit distribution-fitting: the model infers <em>what answers usually look like</em>, including the label frequencies — majority-label bias and recency bias (the last example pulls hardest) are well documented in the calibration literature. Temperature 0 makes the bias <em>deterministic</em>, not absent. Balance the labels, vary the order, and ideally end on a neutral-format example."
    },

    {
      type: "mcq",
      q: "You provide five beautifully reasoned few-shot examples. Outputs are indeed well reasoned — but in the wrong structure. Looking closer, each of your five examples is formatted differently. The lesson?",
      opts: [
        "Five examples is too few for reliable structure; ten or more are needed before the formatting stabilizes",
        "Few-shot teaches surface format as strongly as content — make every example share one identical skeleton",
        "The model is too small to maintain formatting and reasoning at once; upgrade it before you re-prompt it",
        "Formatting belongs in the system prompt; few-shot examples can carry content but never output structure"
      ],
      correct: 1,
      exp: "Format imitation is the most robust few-shot effect — models copy the <em>shape</em> of demonstrations even when they ignore their logic. Five inconsistent examples teach “format is negotiable.” Make every example identical in skeleton, and remember the final example dominates via recency. One consistent example often beats five inconsistent ones."
    },

    {
      type: "mcq",
      q: "Single chain-of-thought gets multi-step word problems right ~70% of the time, and the errors look scattered — different wrong answers each run, no systematic pattern. Cheapest accuracy lever, same model?",
      opts: [
        "Temperature 0 — commit to the single most likely reasoning path instead of gambling on samples",
        "Add “think very carefully, this is important” so the model allocates more effort per problem",
        "Fine-tune on a few thousand solved word problems until the errors become systematic and fixable",
        "Self-consistency — sample ~9 chains at temperature 0.7 and majority-vote on the final answers"
      ],
      correct: 3,
      exp: "Scattered, decorrelated errors are the precondition self-consistency exploits: if each chain is right 70% of the time and wrong <em>differently</em>, the vote is right far more often — gains of 10–20 points on math benchmarks are typical. Costs k&times; tokens, and requires a discrete, comparable final answer to vote on. Temperature 0 locks in one path's mistakes; that's the opposite move."
    },

    {
      type: "mcq",
      q: "Your pairwise LLM-judge eval has a problem: when you swap which answer is shown first, the verdict flips in 30% of comparisons. The fix?",
      opts: [
        "Move to a larger judge model, whose verdicts are stable enough to trust in just one presentation order",
        "Run each comparison in both orders; count a win only when verdicts agree, else score it a tie",
        "Always place the baseline answer first, so the position bias at least applies consistently across runs",
        "Drop the judge's temperature to zero so repeated comparisons always return the identical verdict each time"
      ],
      correct: 1,
      exp: "Position bias is one of the best-documented judge pathologies (the MT-Bench paper measured it directly): judges systematically favor one slot regardless of content. Order-swapping with agreement-gating is the standard mitigation; randomizing order merely <em>spreads</em> the bias evenly rather than removing noise. Always-baseline-first bakes the bias into your metric. Temperature 0 makes a biased verdict repeatable."
    },

    {
      type: "mcq",
      q: "Same eval, new pathology: the judge consistently scores longer answers higher, even when the extra words are padding. Best mitigation?",
      opts: [
        "Truncate every answer to one identical word count before judging, so length cannot enter the verdict",
        "Let the evaluated model judge its own outputs — it knows its style and won't reward alien padding",
        "Score rubric criteria separately, mark unsupported padding down, and length-control the comparisons",
        "Raise the judge's temperature so verbose answers stop reliably winning on superficial fluency alone"
      ],
      correct: 2,
      exp: "Verbosity bias is strong enough that leaderboards built length-controlled variants (AlpacaEval-LC) specifically to cancel it. Rubrics force the judge to commit to <em>which</em> qualities scored, exposing length-driven inflation. Truncation destroys legitimately better long answers, and self-judging trades one bias for a worse one — <b>self-preference bias</b>, where judges favor their own generations."
    },

    {
      type: "mcq",
      q: "A pipeline needs strict JSON. The prompt pleads “ALWAYS respond with valid JSON” — capitalized, three times. It still breaks ~2% of the time and kills the parser. Best fix?",
      opts: [
        "Plead a fourth time with stronger wording plus a worked example showing the downstream parser failure",
        "Lower the temperature to 0 — the malformed outputs are sampling noise, and determinism restores validity",
        "Catch the parse failures and return an empty object, so the pipeline degrades gracefully on bad responses",
        "Use structured-output / constrained decoding so invalid tokens can't be sampled; keep a retry fallback"
      ],
      correct: 3,
      exp: "The reliability ladder for structured output: <b>constrained decoding &gt; tool/function schema &gt; few-shot with prefill &gt; instructions &gt; begging</b>. Grammar-constrained sampling masks invalid tokens at generation time, making malformed JSON impossible rather than unlikely. At 50K calls/day, 2% is a thousand daily failures — and temperature 0 just makes them reproducible."
    },

    {
      type: "mcq",
      q: "“Do NOT mention the competitor. Do NOT apologize. Do NOT use bullet points.” The output mentions the competitor in sentence one. Highest-leverage rewrite?",
      opts: [
        "State positively what to do — “discuss only our product, in flowing prose” — keeping negation for red lines",
        "Move all three prohibitions to the very top of the system prompt, where instruction salience peaks highest",
        "Repeat each prohibition at both the start and the end of the prompt to beat the U-shaped recall curve",
        "Attach a penalty clause — “any reply naming the competitor is invalid” — to raise the stakes for the model"
      ],
      correct: 0,
      exp: "The pink-elephant problem: to obey “don't mention X,” the model must represent X, which primes generating it — negated instructions measurably underperform positive ones. Positive specification constrains the output space directly instead of flagging a hole in it. Keep negative constraints for genuine red lines, few enough to stay salient — and enforce hard bans with output filters, not prose."
    },

    {
      type: "mcq",
      q: "A 40K-token RAG prompt: instructions on top, thirty retrieved documents, and one critical compliance rule sitting around token 20,000. The rule is routinely ignored. The fix?",
      opts: [
        "Switch to a model with a 10× larger context window, so token 20,000 sits proportionally far earlier",
        "Move the rule out of the middle — restate it at the prompt's end; recall over long context is U-shaped",
        "Mark the rule “CRITICALLY IMPORTANT” where it stands — explicit emphasis substitutes for edge position",
        "Lower the temperature so the model reads every one of the retrieved documents more carefully before it answers"
      ],
      correct: 1,
      exp: "“Lost in the middle” is an empirical regularity: retrieval quality is strong at the context's start and end and sags in between — and a bigger window inherits the same U-shape, just longer. Position <em>is</em> salience. Put load-bearing constraints at the edges, restate them after long evidence blocks, and prune retrieval: ten relevant documents beat thirty mediocre ones twice over."
    },

    {
      type: "mcq",
      q: "The brief reads: “Make it creative but professional, detailed but concise, simple but comprehensive.” Every output is mush. Highest-leverage fix?",
      opts: [
        "Split the work — raise the temperature for the creative pass, then lower it for the professional edit",
        "Ask the model to define each adjective explicitly first, then write to its own stated definitions of them",
        "Replace the adjectives with a concrete spec — audience, length budget, gold example, priority order",
        "Generate ten candidates and hand-pick the least mushy — selection beats specification at this scale anyway"
      ],
      correct: 2,
      exp: "Three contradictory adjective pairs average out to the safest possible output — mush is the <em>correct</em> solution to an underdetermined spec. Concrete artifacts beat abstract qualities: a length budget operationalizes “concise,” a gold example operationalizes everything at once (it's few-shot in disguise), and a priority order resolves conflicts you couldn't anticipate. Hand-picking outsources specification to your own taste, one sample at a time, forever."
    }
  ]
};
