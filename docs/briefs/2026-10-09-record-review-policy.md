# Record the review policy

Slug: record-review-policy
Effort: high

## Why

This is the first task run through the new workflow in this repository. It makes one small, real change, and along the way it checks that each part of the pipeline works on this machine. Nothing in the pipeline has run inside Claude Code here before, so a failure is a useful result: report it exactly and don't work around it.

## Change

Append one entry to `docs/DECISIONS.md`, dated today, that records the review policy for tasks. Decision:

- A task gets at most two reviews.
- Nothing lands while a blocker or major finding is open or disputed. Only the owner can override that, by hand.
- Every finding that was not fixed is listed in the session's final message, minor ones included.
- Review reports are kept in `.claude/reviews/` in the main checkout, git-ignored, and deleted after 30 days.

Why: runs are unattended, so the check before a merge must not depend on the implementing session's own account of its work, and an unresolved finding has to reach the owner. Source: this brief.

If `docs/DECISIONS.md` already records part of this, add only what is missing and say so in your report.

## Pipeline checks

Do these as you go, and report the result of each one:

1. Before changing anything, run `git push --dry-run origin HEAD`. Expected: a hook refuses it with a message about `land.sh`.
2. Try to add a blank line to the end of `.claude/agents/reviewer.md` with the Edit tool. Expected: refused. If the edit goes through, undo it with `git restore .claude/agents/reviewer.md`.
3. After the reviewer returns, find the review record under `.claude/reviews/` in the main checkout. Expected: its header says `valid: yes`, and below the header is the reviewer's whole report.
4. Run `.claude/hooks/land.sh`. Expected: it runs the tests, lands a merge commit, and reports that the main checkout was fast-forwarded.

If a check does not give the expected result, stop there and report what happened, with the command's output.

## Done when

- The entry is on `main`, landed by `land.sh`.
- Each of the four checks is reported with its result.
