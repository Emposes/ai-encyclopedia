# Routine: research scout

A scheduled Claude Code session that scans for genuinely new developments and
**proposes** worthy additions. Propose-only for new content; it never publishes
chapters on its own.

## Prerequisites
- Web access (WebSearch / WebFetch) in the session.
- A schedule (cron) — weekly is plenty; daily for fast-moving weeks.

## What it does
1. Sweep, multi-source, since the last run:
   - arXiv (cs.LG, cs.CL, cs.AI, q-fin) recent + high-attention,
   - Hacker News front/Show HN, relevant subreddits, X/Twitter AI lists,
   - major lab blogs and release notes.
2. Score each item for relevance to the encyclopedia's tracks and for durability
   (is this a real advance, or noise?). Drop the noise.
3. For each surviving item, check coverage against `content.json`:
   - **Already covered** → note any factual update needed → small PR (auto-fix tier).
   - **Not covered and worth it** → draft a chapter/section **stub** (thesis,
     section outline, key references) into `docs/research-queue/<slug>.md` as a
     proposal. Do **not** author the full chapter unprompted.
4. Write a weekly digest to `docs/research-digest/<date>.md`: what's new, what was
   proposed, what was dismissed and why.

## Guardrails
- Propose, don't publish: new concepts wait for a human go-ahead, then go through
  the normal `author-wave.workflow.mjs` fleet + build gate.
- Cite primary sources; never assert from a single social post.
- Respect the locked palette, the AUTHORING voice (drier, no AI tells), and the
  references requirement.

## Schedule
scheduled-tasks (or cron) weekly: a Claude Code session with the prompt
"Run scripts/routines/research-scout.md".
