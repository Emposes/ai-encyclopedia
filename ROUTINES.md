# Claude Code routines — feedback triage & research scout

Two autonomous routines keep the encyclopedia improving:

| Routine | Cadence | What it does | Prompt |
|---|---|---|---|
| **Feedback triage** | daily | reads new rows from the Supabase `feedback` table, **auto-fixes small issues** via a PR, opens issues for larger requests | `scripts/routines/feedback-triage.md` |
| **Research scout** | weekly | sweeps arXiv/HN/Reddit/lab blogs, **proposes** new content as issues (never auto-publishes) | `scripts/routines/research-scout.md` |

Autonomy is fixed: **auto-fix small via PR, queue big for human review.** Nothing
reaches prod without a PR + the build gate.

---

## Prerequisites (one-time)

1. **Push the repo to GitHub.** The routines run against `github.com/Emposes/ai-encyclopedia`,
   so the current site has to be there. (Prod is deployed from the local CLI, so
   the repo is currently behind — push it first.)
2. **Install the Claude GitHub App** on the repo: run `claude /install-github-app`
   (or install from https://github.com/apps/claude). This lets the action open
   PRs/issues.
3. **Add repo secrets** (Settings → Secrets and variables → Actions → New repository secret):
   - `ANTHROPIC_API_KEY` — from https://platform.claude.com
   - `SUPABASE_URL` = `https://jltpzwzeevbzgwxtievu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API → service_role key
     (feedback triage reads the table with this; it bypasses RLS, so keep it secret).

---

## Option A — GitHub Actions (committed, recommended)

Already in the repo:
- `.github/workflows/feedback-triage.yml` (daily 07:00 UTC)
- `.github/workflows/research-scout.yml` (Mondays 06:00 UTC)

After the prerequisites, each has a **Run workflow** button (Actions tab →
`workflow_dispatch`) to test immediately. Logs and the resulting PRs/issues live
in GitHub.

## Option B — Native Claude Code Routines (cloud, simplest)

At https://claude.ai/code/routines (or `claude /schedule`):
1. **New routine** → select the `Emposes/ai-encyclopedia` repo.
2. Paste the prompt: *"Run the routine in `scripts/routines/feedback-triage.md`."*
   (and a second routine for `research-scout.md`).
3. Set the schedule (daily / weekly), add the **GitHub connector** so it can open
   PRs/issues, and add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as routine
   environment variables (feedback triage only).

The prompt files are the source of truth and work identically in both options.

---

## Closing the loop to prod

Auto-fix PRs land on **GitHub**, but prod currently deploys from the **local
Vercel CLI**, so a merged PR will not go live by itself. Pick one:
- **Connect Vercel to the GitHub repo** (Vercel → Project → Settings → Git) so
  merges to `main` auto-deploy. Cleanest. (Note: video `.mp4`s are gitignored and
  shipped via `.vercelignore` on CLI deploys — a git-based deploy must keep them
  available, e.g. move them to Vercel Blob/R2, or keep deploying media via CLI.)
- **Or** keep deploying manually with `npx vercel deploy --prod` after reviewing
  the day's PRs.

Until one of these is set up, the routines still do their job (PRs + issues +
digests); they just wait for a human to merge and deploy.
