#!/bin/sh
# Lands the current task branch on the main branch. This is the only way a
# Claude session gets work onto main: guard.sh blocks direct pushes.
#
# Run it from the task's worktree, with everything committed:
#   .claude/hooks/land.sh
#
# It refuses unless all of these hold:
#   - the working tree is clean and the branch has commits that main lacks;
#   - the main checkout has no commits that were never pushed;
#   - the branch leaves .claude/settings.json, .claude/hooks and
#     .claude/agents/reviewer.md as they were when it started, and adds no
#     second agent called "reviewer";
#   - the newest review record for the current commit is valid and says PASS;
#   - main merges into the branch without conflicts, if main has moved;
#   - scripts/test.sh passes on exactly the tree that will land.
# Then it creates a merge commit (first parent: main, second parent: the
# reviewed commit), pushes it to origin, and fast-forwards this branch and,
# when it can do so safely, the main checkout.
#
# The repo owner can land without a PASS by typing, by hand:
#   .claude/hooks/land.sh --user-override "reason"
# Every other check still applies, and the reason is recorded.

set -u

die() { echo "land.sh: $*" >&2; exit 1; }

# Prints the first tracked agent file, other than the real one, that calls
# itself "reviewer". Claude Code picks among same-named agents by location,
# so such a file could stand in for the reviewer.
other_reviewer() {
  git -C "$1" ls-files -- '*.md' | grep -E '(^|/)\.claude/agents/' |
    grep -vx '.claude/agents/reviewer.md' |
    while IFS= read -r f; do
      if grep -Eq "^name:[[:space:]]*[\"']?reviewer[\"']?[[:space:]]*\$" "$1/$f" 2>/dev/null; then
        echo "$f"
        break
      fi
    done
}

override=""
case "${1:-}" in
  "") ;;
  --user-override)
    override=${2:-}
    [ -n "$override" ] || die 'usage: land.sh --user-override "reason"' ;;
  *) die 'usage: land.sh [--user-override "reason"]' ;;
esac

top=$(git rev-parse --show-toplevel 2>/dev/null) || die "not inside a git repository"
cd "$top" || die "cannot enter $top"
common=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
main_root=$(dirname "$common")

branch=$(git symbolic-ref --quiet --short HEAD) || die "HEAD is detached; check out the task branch"
default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
[ -n "$default" ] || default=main
[ "$branch" != "$default" ] || die "this is $default; a task lands from its own worktree branch"

if [ -f "$(git rev-parse --git-path MERGE_HEAD)" ]; then
  die "a merge is in progress, probably from an interrupted land.sh. Run 'git merge --abort', then run land.sh again"
fi
[ -z "$(git status --porcelain)" ] || die "the working tree has uncommitted or untracked files; commit or remove them first"

git fetch --quiet origin "$default" || die "could not fetch origin/$default"
base=$(git rev-parse --verify --quiet "origin/$default^{commit}") || die "origin/$default does not exist"
head=$(git rev-parse HEAD)
fork=$(git merge-base "$base" "$head") || die "this branch shares no history with origin/$default"
[ "$(git rev-list --count "$base..$head")" -gt 0 ] || die "nothing to land: origin/$default already contains this branch"

# Commits on the local main branch that origin lacks did not come through
# this script. Landing now would leave the two diverged.
unpushed=$(git rev-list --count "$base..refs/heads/$default" 2>/dev/null || echo 0)
[ "$unpushed" -eq 0 ] || die "the local $default branch has $unpushed commit(s) that origin/$default lacks. They have to be pushed, or removed, by the repo owner before anything can land. Stop and tell the user"

if ! git diff --quiet "$fork" "$head" -- .claude/settings.json .claude/hooks .claude/agents/reviewer.md; then
  die "this branch changes .claude/settings.json, .claude/hooks or .claude/agents/reviewer.md. Only the repo owner changes those, directly on $default. Take those changes out of the branch and request a new review"
fi
other=$(other_reviewer "$top")
[ -z "$other" ] || die "$other also defines an agent called \"reviewer\", which could replace the real one. Remove or rename it and request a new review"

# Review record for exactly this commit.
dir="$main_root/.claude/reviews/$(printf '%s' "$branch" | tr '/ ' '--')"
record=$(grep -l "^commit: $head\$" "$dir"/*.md 2>/dev/null | sort | tail -n 1)
if [ -n "$override" ]; then
  review_line="Review: overridden by the user: $override"
else
  [ -n "$record" ] || die "no review record for commit $head. Delegate to the reviewer subagent with the branch name and the brief path, and wait for its report"
  valid=$(sed -n 's/^valid: //p' "$record" | head -n 1)
  verdict=$(sed -n 's/^verdict: //p' "$record" | head -n 1)
  [ "$valid" = "yes" ] || die "the review record $record is not valid: $valid. Request the review again"
  [ "$verdict" = "PASS" ] || die "the review of $head says $verdict (see $record). Fix the blocker and major findings, commit, and request a new review; or stop and report to the user"
  review_line="Review: PASS, $(basename "$record")"
fi

merging=no
cleanup() { [ "$merging" = yes ] && git merge --abort >/dev/null 2>&1; merging=no; }
trap 'cleanup; exit 130' INT TERM HUP

# Bring in main if it has moved since the branch started.
if [ "$base" != "$fork" ]; then
  merging=yes
  if ! git merge --no-commit --no-ff --quiet "$base" >/dev/null 2>&1; then
    cleanup
    die "origin/$default has moved and conflicts with this branch. Run 'git merge origin/$default', resolve the conflicts, run the tests, commit, and request a new review"
  fi
  echo "land.sh: origin/$default has moved; testing this branch merged with it"
fi

[ -x scripts/test.sh ] || { cleanup; die "scripts/test.sh is missing or not executable"; }
echo "land.sh: running scripts/test.sh"
if ! scripts/test.sh; then
  cleanup
  die "scripts/test.sh fails on the tree that would land. Nothing was pushed"
fi
if ! git diff --quiet; then
  cleanup
  die "scripts/test.sh changed tracked files, so the tested tree is not the committed one. Nothing was pushed"
fi

tree=$(git write-tree) || { cleanup; die "could not write the tree"; }
brief=$(git diff --name-only --diff-filter=A "$fork" "$head" -- docs/briefs | head -n 1)
title=""
[ -n "$brief" ] && [ -f "$brief" ] && title=$(sed -n 's/^# *//p' "$brief" | head -n 1)
subject="Merge $branch"
[ -n "$title" ] && subject="$subject: $title"
merge=$(printf '%s\n\nReviewed commit: %s\n%s\n' "$subject" "$head" "$review_line" |
        git commit-tree "$tree" -p "$base" -p "$head") || { cleanup; die "could not create the merge commit"; }

if ! git push --quiet origin "$merge:refs/heads/$default"; then
  cleanup
  die "the push was rejected, most likely because origin/$default moved while this ran. Run land.sh again"
fi

cleanup
trap - INT TERM HUP
git merge --quiet --ff-only "$merge" || echo "land.sh: note: could not fast-forward $branch to the merge commit" >&2

if [ -n "$override" ]; then
  mkdir -p "$dir"
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  {
    echo "<!-- Override record, written by .claude/hooks/land.sh. -->"
    echo "branch: $branch"
    echo "commit: $head"
    echo "date: $stamp"
    echo "landed as: $merge"
    echo "override: $override"
  } > "$dir/$stamp-$(printf '%s' "$head" | cut -c1-10)-override.md"
fi

# Keep the main checkout current when that is safe: git refuses a
# fast-forward that would overwrite anything there.
if [ "$main_root" != "$top" ] &&
   [ "$(git -C "$main_root" symbolic-ref --quiet --short HEAD 2>/dev/null)" = "$default" ]; then
  if git -C "$main_root" merge --quiet --ff-only "$merge" >/dev/null 2>&1; then
    echo "land.sh: fast-forwarded the main checkout"
  else
    echo "land.sh: note: the main checkout was not fast-forwarded; run 'git pull --ff-only' there"
  fi
fi

short=$(git rev-parse --short "$merge")
echo "land.sh: landed $branch on $default as $short"
echo "land.sh: $review_line"
echo "land.sh: the task's whole diff: git diff $short^1 $short"
