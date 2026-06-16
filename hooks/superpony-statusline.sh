#!/usr/bin/env bash
# superpony — statusline badge showing the active intensity.
# Reads the per-project flag at $CLAUDE_PROJECT_DIR/.claude/.superpony-mode (or $PWD).
flag="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/.superpony-mode"
[ -f "$flag" ] || exit 0

mode=$(head -n1 "$flag" | tr -d '[:space:]')
case "$mode" in lite|full|ultra) ;; *) mode=full ;; esac

if [ "$mode" = "full" ]; then
    printf '\033[38;5;213m[SUPERPONY]\033[0m'
else
    printf '\033[38;5;213m[SUPERPONY:%s]\033[0m' "$(printf '%s' "$mode" | tr '[:lower:]' '[:upper:]')"
fi
