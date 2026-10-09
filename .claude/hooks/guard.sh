#!/bin/sh
# PreToolUse hook for the Bash tool.
#
# Blocks direct pushes from Claude sessions. The only way onto the main branch
# is .claude/hooks/land.sh, which checks the review record and runs the tests
# before it pushes. Also blocks running land.sh with --user-override, which is
# for the repo owner to type by hand.
#
# Exit 2 blocks the tool call and shows stderr to Claude. Exit 0 leaves the
# call to the normal permission flow. settings.json runs this as
# "guard.sh || exit 2", so a missing or broken script blocks instead of
# silently letting pushes through.

cmd=$(jq -r '.tool_input.command // empty') || {
  echo "guard.sh could not read the hook input. Is jq installed?" >&2
  exit 2
}
# One line, with line continuations removed, so "git \<newline> push" is seen too.
flat=$(printf '%s' "$cmd" | tr '\n\\' '  ')

# "git", any global options, then the push subcommand.
opt='(-[Cc]|--git-dir|--work-tree|--namespace|--exec-path|--config-env)[[:space:]]+[^[:space:]]+|-[^[:space:]]+'
push="(^|[^[:alnum:]_.-])git([[:space:]]+($opt))*[[:space:]]+(push|send-pack)([^[:alnum:]_-]|\$)"

if printf '%s\n' "$flat" | grep -Eq -- "$push"; then
  cat >&2 <<'MSG'
Direct git push is blocked in this repository. Work reaches the main branch
only through .claude/hooks/land.sh, run from the task's worktree after the
reviewer subagent has returned VERDICT: PASS for the current commit.
If this command only mentions "git push" in text, such as a commit message,
reword it.
MSG
  exit 2
fi

if printf '%s\n' "$flat" | grep -q -- '--user-override' &&
   printf '%s\n' "$flat" | grep -q -- 'land\.sh'; then
  cat >&2 <<'MSG'
land.sh --user-override is for the repo owner to type by hand. Stop and report
the open findings to the user instead.
If this command only writes text that mentions it, write that text with the
Write or Edit tool.
MSG
  exit 2
fi

exit 0
