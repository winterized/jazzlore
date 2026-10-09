#!/bin/sh
# Builds Jazzlore and runs its tests.
#
#   scripts/test.sh                        everything: the gate land.sh runs
#   scripts/test.sh musicians ui           only these packages (folder names
#                                          under apps/ and packages/)
#   scripts/test.sh e2e [playwright args]  the Playwright suite; not part of
#                                          the gate
#
# Exits 0 only if every step passed. Prints one line per step, the errors of
# each failing step and a summary. The full output goes to a log file under
# .test-logs/ (git-ignored), whose path it prints.
#
# Safe to run in several checkouts at once: each has its own node_modules,
# build output and log; only pnpm's content store is shared. The e2e suite
# uses fixed ports, so `e2e` holds a machine-wide lock instead.

set -u

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "test.sh: not inside a git checkout" >&2
  exit 2
}
cd "$root" || exit 2

# Shells that skip the login profile (hooks, land.sh) may lack nvm's PATH.
if ! command -v pnpm >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  set +u
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
  set -u
fi
command -v pnpm >/dev/null 2>&1 || {
  echo "test.sh: pnpm not found; this repo needs Node >= 22.13 and pnpm 11" >&2
  exit 2
}

export NO_COLOR=1 FORCE_COLOR=0

mkdir -p .test-logs
log="$root/.test-logs/$(date +%Y%m%dT%H%M%S)-$$.log"
step_out="$root/.test-logs/.step-$$"
: > "$log"
lock=""

cleanup() {
  rm -f "$step_out"
  [ -n "$lock" ] && [ "$(cat "$lock/pid" 2>/dev/null)" = "$$" ] && rm -rf "$lock"
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM HUP

failed=""
started=$(date +%s)

# run_step <name> <command...>: runs the command with its output in the log;
# on failure prints the lines that look like errors, or the tail.
run_step() {
  name=$1
  shift
  t0=$(date +%s)
  printf '\n===== %s: %s\n' "$name" "$*" >> "$log"
  if "$@" > "$step_out" 2>&1; then rc=0; else rc=$?; fi
  cat "$step_out" >> "$log"
  secs=$(($(date +%s) - t0))
  if [ "$rc" -eq 0 ]; then
    printf '  ok    %-10s %5ss\n' "$name" "$secs"
  else
    printf '  FAIL  %-10s %5ss  (exit %s)\n' "$name" "$secs" "$rc"
    errors=$(grep -E '(FAIL|✗|×|✘|error TS|[Ee]rror:|ERR_PNPM| error |[0-9]+ failed|AssertionError)' "$step_out" | head -n 40)
    [ -n "$errors" ] || errors=$(tail -n 40 "$step_out")
    printf '%s\n' "$errors" | sed 's/^/        | /'
    failed="$failed $name"
  fi
  return "$rc"
}

finish() {
  total=$(($(date +%s) - started))
  echo
  if [ -z "$failed" ]; then
    echo "test.sh: PASS in ${total}s"
  else
    echo "test.sh: FAIL in ${total}s; failed steps:$failed"
  fi
  echo "test.sh: full log: $log"
  [ -z "$failed" ]
  exit $?
}

install() {
  # CI=true keeps pnpm from prompting when it has to rebuild node_modules.
  run_step install env CI=true pnpm install --frozen-lockfile --prefer-offline || finish
}

# ---------------------------------------------------------------- e2e mode
if [ "${1:-}" = e2e ]; then
  shift
  lockdir="${XDG_CACHE_HOME:-$HOME/.cache}/jazzlore"
  mkdir -p "$lockdir"
  candidate="$lockdir/e2e.lock"
  announced=no
  while ! mkdir "$candidate" 2>/dev/null; do
    holder=$(cat "$candidate/pid" 2>/dev/null || true)
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
      echo "test.sh: removing a stale e2e lock left by pid $holder"
      rm -rf "$candidate"
      continue
    fi
    if [ "$announced" = no ]; then
      echo "test.sh: waiting for the e2e lock, held by pid ${holder:-?} in $(cat "$candidate/where" 2>/dev/null || echo '?')"
      announced=yes
    fi
    sleep 10
  done
  lock=$candidate
  echo "$$" > "$lock/pid"
  echo "$root" > "$lock/where"

  echo "test.sh: e2e in $root"
  install
  # Browsers go to Playwright's shared per-user cache, not into each
  # checkout's node_modules, so a fresh worktree doesn't download them again.
  run_step browsers env -u PLAYWRIGHT_BROWSERS_PATH pnpm exec playwright install chromium webkit
  # CI=1: never reuse a server another checkout left on one of the ports.
  [ -z "$failed" ] && run_step e2e env -u PLAYWRIGHT_BROWSERS_PATH CI=1 PLAYWRIGHT_HTML_OPEN=never \
    pnpm exec playwright test --reporter=line "$@"
  finish
fi

# ------------------------------------------------------- build + unit tests
filters=""
paths=""
budget=yes
if [ $# -gt 0 ]; then
  budget=no
  for name in "$@"; do
    if [ -d "apps/$name" ]; then
      paths="$paths apps/$name"
    elif [ -d "packages/$name" ]; then
      paths="$paths packages/$name"
    else
      echo "test.sh: unknown package '$name'; use a folder name under apps/ or packages/, or 'e2e'" >&2
      exit 2
    fi
    filters="$filters --filter @jazzlore/$name"
    [ "$name" = musicians ] && budget=yes
  done
fi

if [ -z "$filters" ]; then
  echo "test.sh: everything, in $root"
  scope="-r"
else
  echo "test.sh:$paths, in $root"
  scope=$filters
fi

install
# $scope and $paths are deliberately unquoted: they hold several words.
# shellcheck disable=SC2086
{
  run_step lint pnpm exec eslint ${paths:-.}
  run_step typecheck pnpm $scope --no-bail --if-present run typecheck
  run_step build pnpm $scope --no-bail --if-present run build
  run_step unit pnpm $scope --no-bail --if-present run test:run
}
if [ -z "$filters" ]; then
  run_step scripts node --test scripts/*.test.mjs
fi
if [ "$budget" = yes ]; then
  run_step budget node tests/musicians-bundle-budget.mjs
fi
finish
