#!/bin/sh
# SubagentStop hook, matcher "reviewer".
#
# Saves the reviewer's final report, word for word, as the review record for
# the commit it reviewed. Neither the reviewer (which has no write tools) nor
# the implementing session writes this file.
#
# Where the report is. In auto mode Claude Code has a subagent deliver its
# report with a SubagentHandback tool call, {"message": "<the report>"}, and
# whatever plain text it wrote last is not the report. That call is in the
# subagent's transcript, not in the hook input, so it is read from there. In
# the other modes the report is the subagent's last message, which the hook
# input carries as last_assistant_message.
#
# Records go to <main checkout>/.claude/reviews/<branch>/, which is git-ignored
# and shared by every worktree, so a record outlives the task's worktree.
# Records older than 30 days are deleted each time a new one is written.
#
# Always exits 0. If anything here fails there is no valid record, and
# land.sh refuses to land without one, so failure is safe.
#
#   record-review.sh --show <transcript.jsonl>
# prints the report found in a reviewer's transcript and writes nothing.

# The report in the last SubagentHandback call of a subagent transcript, or
# nothing. Reads line by line, so a half-written last line is skipped. Only
# the subagent's own tool calls count: text it was sent or read does not.
handback() {
  jq -nrR '
    [ inputs | fromjson? | select(.type? == "assistant")
      | .message.content[]?
      | select(.type? == "tool_use" and .name? == "SubagentHandback")
      | .input ] | last
    | if . == null then empty
      elif (.message? | type) == "string" then .message
      else [.. | strings]
           | (map(select(test("VERDICT:"))) | max_by(length)) // join("\n\n")
      end' "$1" 2>/dev/null
}

if [ "${1:-}" = "--show" ]; then
  [ -f "${2:-}" ] || { echo "usage: record-review.sh --show <reviewer transcript .jsonl>" >&2; exit 1; }
  shown=$(handback "$2")
  [ -n "$shown" ] || { echo "no SubagentHandback call in $2" >&2; exit 1; }
  printf '%s\n' "$shown"
  exit 0
fi

input=$(cat)
field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }
has_verdict() { printf '%s\n' "$1" | grep -Eq 'VERDICT:[[:space:]*_`]*(PASS|BLOCK)'; }

cwd=$(field .cwd)
mode=$(field .permission_mode)
last=$(field .last_assistant_message)
transcript=$(field .agent_transcript_path)

top=$(git -C "${cwd:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
common=$(cd "$top" && cd "$(git rev-parse --git-common-dir)" && pwd -P) || exit 0
main_root=$(dirname "$common")

head=$(git -C "$top" rev-parse HEAD 2>/dev/null) || exit 0
branch=$(git -C "$top" symbolic-ref --quiet --short HEAD 2>/dev/null || echo detached)
default=$(git -C "$top" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
[ -n "$default" ] || default=main

# The handback wins when there is one. The transcript may still be being
# written when this hook starts, so a handback that names the current commit is
# waited for, for a few seconds, when the session is in auto mode or the last
# message is not a report.
report=""; from=""
if [ -n "$transcript" ]; then
  limit=${REVIEW_RECORD_WAIT:-15}; n=0
  while :; do
    [ -f "$transcript" ] && report=$(handback "$transcript")
    case $report in *"$head"*) break ;; esac
    [ "$mode" != "auto" ] && has_verdict "$last" && break
    [ "$n" -lt "$limit" ] || break
    sleep 1; n=$((n + 1))
  done
fi
if [ -n "$report" ]; then
  from="handback"
elif [ -n "$last" ]; then
  report=$last; from="last message"
fi

verdict=$(printf '%s\n' "$report" | grep -Eo 'VERDICT:[[:space:]*_`]*(PASS|BLOCK)' | tail -n 1 | grep -Eo '(PASS|BLOCK)$')
reviewed=$(printf '%s\n' "$report" | grep -Eo 'REVIEWED:[[:space:]*_`]*[0-9a-f]{40}' | tail -n 1 | grep -Eo '[0-9a-f]{40}$')

# A record counts only if it is a complete review of exactly the commit the
# branch is at, made with the reviewer definition and hooks the branch started
# from, and with no second agent file calling itself "reviewer".
reason=""
seen="permission mode: ${mode:-not given}; hook input fields: $(printf '%s' "$input" | jq -r 'keys | join(",")' 2>/dev/null)"
if [ -z "$report" ]; then
  reason="no report found; $seen"
elif [ -z "$verdict" ]; then
  reason="the report has no VERDICT line; report taken from the reviewer's $from; $seen"
elif [ -z "$reviewed" ]; then
  reason="the report has no REVIEWED line"
elif [ "$reviewed" != "$head" ]; then
  reason="the report covers $reviewed but the branch is at $head"
elif [ -n "$(git -C "$top" status --porcelain 2>/dev/null)" ]; then
  reason="the working tree had uncommitted changes when the review ended"
else
  base=$(git -C "$top" merge-base "origin/$default" "$head" 2>/dev/null)
  other=$(git -C "$top" ls-files -- '*.md' | grep -E '(^|/)\.claude/agents/' |
          grep -vx '.claude/agents/reviewer.md' |
          while IFS= read -r f; do
            if grep -Eq "^name:[[:space:]]*[\"']?reviewer[\"']?[[:space:]]*\$" "$top/$f" 2>/dev/null; then
              echo "$f"; break
            fi
          done)
  if [ -n "$base" ] && ! git -C "$top" diff --quiet "$base" -- \
       .claude/settings.json .claude/hooks .claude/agents/reviewer.md 2>/dev/null; then
    reason="the branch changes .claude/settings.json, .claude/hooks or .claude/agents/reviewer.md"
  elif [ -n "$other" ]; then
    reason="$other also defines an agent called reviewer"
  fi
fi

dir="$main_root/.claude/reviews/$(printf '%s' "$branch" | tr '/ ' '--')"
mkdir -p "$dir" || exit 0
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="$dir/$stamp-$(printf '%s' "$head" | cut -c1-10).md"

{
  echo "<!-- Review record, written by $0 from the reviewer's report. -->"
  echo "branch: $branch"
  echo "commit: $head"
  echo "date: $stamp"
  echo "verdict: ${verdict:-NONE}"
  echo "source: ${from:-none}"
  if [ -z "$reason" ]; then echo "valid: yes"; else echo "valid: no ($reason)"; fi
  echo
  echo "---"
  echo
  printf '%s\n' "$report"
} > "$file" || exit 0

# Tidy up: drop records older than 30 days, then empty folders.
find "$main_root/.claude/reviews" -type f -name '*.md' -mtime +30 -exec rm -f {} + 2>/dev/null
find "$main_root/.claude/reviews" -mindepth 1 -type d -empty -exec rmdir {} + 2>/dev/null

# One line for the person at the terminal.
state="valid"; [ -z "$reason" ] || state="not valid: $reason"
jq -cn --arg m "Review record saved: $file (${verdict:-no verdict}, $state)" '{systemMessage: $m}' 2>/dev/null
exit 0
