#!/usr/bin/env zsh
#
# gaggle — Multi-Session Worktree bootstrap (zsh).
#
# Extracted verbatim from `.devcontainer/.zshrc` (the Goose Multi-Session
# Worktree Workflow block, spec: specs/005-goose-multi-session-worktree).
# Runs a command inside this shell's feature worktree: one worktree per shell,
# tmux window = shell = worktree = branch = feature.
#
# Usage:
#   worktree.zsh <command> [args...]
#   → `_wt_ensure command args...`  (Enter at the prompt = main tree, no worktree)
#
# Knobs (env): MAIN_BRANCH (default main), WT_ROOT (default <parent>/<proj>-wt),
# GOOSE_WT (runtime binding, set per shell — do not edit).

: "${MAIN_BRANCH:=main}"

# --- Core worktree logic: ensure a worktree is bound to this shell, then run ---
_wt_ensure() {
  local wt="${GOOSE_WT:-}"

  # 1) This shell already has a bound worktree → reuse it.
  if [[ -n "$wt" && -d "$wt" ]]; then
    _wt_run "$wt" "$@"
    return $?
  fi

  # 2) Already INSIDE a linked worktree (cd'd there manually) → bind & use it.
  local top
  top="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "goose: not inside a git repository"; return 1
  }
  if [[ -f "$top/.git" ]]; then
    export GOOSE_WT="$top"
    _wt_run "$top" "$@"
    return $?
  fi

  # 3) At project root, no binding → ask for a feature name and create/reuse a
  #    worktree, OR press Enter to run in the main tree (no worktree).
  local WT_ROOT="${WT_ROOT:-$(dirname "$PWD")/$(basename "$PWD")-wt}"
  local feat
  print -n "Feature name (Enter for main tree, no worktree): "
  read -r feat || return 1
  feat="${feat:l}"; feat="${feat// /-}"          # lowercase, spaces → dashes
  if [[ -z "$feat" ]]; then
    unset GOOSE_WT
    echo "→ running in the main tree (no worktree)"
    "$@"
    return $?
  fi

  wt="$WT_ROOT/$feat"
  if [[ ! -d "$wt" ]]; then
    mkdir -p "$WT_ROOT"
    git worktree add "$wt" -b "$feat" || return 1
    echo "→ created worktree $wt (branch $feat)"
  else
    echo "→ reusing existing worktree $wt"
  fi

  export GOOSE_WT="$wt"
  _wt_run "$wt" "$@"
  local rc=$?
  _wt_check "$wt"
  cd "$wt" || return $rc                       # post-exit: land on the feature branch
  echo "Tip: now in $wt (branch $feat) — 'wt audit' lists all worktrees."
  return $rc
}

_wt_run() {
  local wt="$1"; shift
  ( cd "$wt" && "$@" )                         # subshell: runs command in the worktree
}

# --- Post-exit WIP check: commit / merge / skip (never auto-merge) ---
_wt_check() {
  local wt="$1"
  local branch dirty ahead
  branch="$(git -C "$wt" branch --show-current)"
  dirty="$(git -C "$wt" status --porcelain | wc -l | tr -d ' ')"
  ahead="$(git -C "$wt" rev-list --count "$MAIN_BRANCH..$branch" 2>/dev/null | tr -d ' ')"
  ahead="${ahead:-0}"

  if (( dirty == 0 && ahead == 0 )); then
    echo "✓ $branch: clean, merged to $MAIN_BRANCH"; return
  fi

  echo "⚠  $branch still has work:"
  (( dirty > 0 )) && echo "   • $dirty uncommitted file(s)"
  (( ahead  > 0 )) && echo "   • $ahead commit(s) not on $MAIN_BRANCH"
  [[ -t 0 ]] || { echo "   (non-interactive — left as-is)"; return; }

  print -n "   [c]ommit WIP  [m]erge to main  [s]kip: "; read -r ans
  case "${ans:l}" in
    c) git -C "$wt" add -A && git -C "$wt" commit -m "wip($branch): auto-save" \
         && echo "   ✓ WIP committed on $branch" ;;
    m) (( dirty > 0 )) && git -C "$wt" add -A && git -C "$wt" commit -m "wip($branch): auto-save"
       _wt_merge "$wt" "$branch" ;;
    *) echo "   ✓ left as-is — run 'wt audit' later" ;;
  esac
}

# Merge must run from the main worktree (main is only checked out there).
_wt_merge() {
  local wt="$1" branch="$2"
  local main
  main="$(git -C "$wt" worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
  [[ -n "$(git -C "$main" status --porcelain)" ]] && { echo "✗ main worktree dirty — stash there first"; return 1; }
  [[ "$(git -C "$main" branch --show-current)" != "$MAIN_BRANCH" ]] && { echo "✗ main not on $MAIN_BRANCH"; return 1; }
  git -C "$wt" merge "$MAIN_BRANCH" --no-edit && {
    git -C "$main" merge "$branch" --no-ff -m "Merge $branch"
  } || echo "✗ conflicts merging $MAIN_BRANCH into $branch — resolve in $wt, then re-run"
}

_wt_ensure "$@"
