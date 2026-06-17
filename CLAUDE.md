# CLAUDE.md — working ON the superpony repo

Project memory for an agent editing superpony itself (not for using it).

## What this is

Fusion of Superpowers (process discipline) + Ponytail (minimalism), shipped as a
**Claude Code plugin** — `.claude-plugin/plugin.json` + `marketplace.json`. Install
elsewhere: `/plugin marketplace add https://github.com/csscoder/superpony` then
`/plugin install superpony@superpony`.

## Source of truth

- `skills/` is the **single source of truth.** No `vendor/`, no upstream re-sync
  — superpony is standalone and maintained directly.
- Canonical policy lives **only** in `skills/superpony/SKILL.md`. Do NOT
  duplicate policy across overlays.

## Skills

- Skill-invocation directives use the `superpony:` prefix (`superpony:executing-plans`)
  — mirrors the shipped `superpowers` plugin. Bare-name stays only in prose/examples.
  The `ponytail:` comment marker is NOT a skill ref — never prefix it.
- Overlays = thin `🐴 Ponytail overlay (Superpony)` blocks on `writing-plans`,
  `executing-plans`, `requesting-code-review`, `test-driven-development`. Each carries
  its **local scope cap** (survives direct/subagent entry) and defers to root for canon.
  Keep them thin — add the cap, reference root, don't restate the policy.

## Hooks

- Node hooks resolve paths via `${CLAUDE_PLUGIN_ROOT}` (in `hooks/hooks.json`) and
  `__dirname` (inside hook modules); the per-project mode flag resolves via
  `CLAUDE_PROJECT_DIR`. Never hardcode plugin paths.
- `superpony-lib.js` (`buildInstructions`) reads the injection live from the skill files
  — so editing the root skill updates the injection; don't fork the text into the hook.
- Default mode: `SUPERPONY_DEFAULT_MODE` env → `full`. Modes: `off|lite|full|ultra`.
- `<project>/.claude/.superpony-mode` is per-project **runtime state** (the hook writes
  it into the target project via `CLAUDE_PROJECT_DIR`), git-ignored. Never commit it.
- The skill bootstrap is `using-skills` (renamed from the upstream `using-superpowers`) so it
  no longer collides by name with the upstream `superpowers` plugin if both are installed.

## Hygiene

- UTF-8 for all files. Git commits and technical messages in English.
- When editing skills/hooks, keep policy canonical in root; verify overlays still defer.
- Both parents are MIT; keep attribution in README.
