# CLAUDE.md — working ON the superpony repo

Project memory for an agent editing superpony itself (not for using it).

## What this is

Fusion of Superpowers (process discipline) + Ponytail (minimalism), shipped as Claude
Code **project files** — the `.claude/` directory. Install elsewhere: `cp -r .claude
/path/to/project/`. NOT a plugin: no `plugin.json`, no marketplace (by design).

## Source of truth

- `.claude/skills/` is the **single source of truth.** No `vendor/`, no upstream re-sync
  — superpony is standalone and maintained directly.
- Canonical policy lives **only** in `.claude/skills/superpony/SKILL.md`. Do NOT
  duplicate policy across overlays.

## Skills

- Cross-references are **bare-name** (`executing-plans`, `ponytail-review`) — project
  skills are invoked unprefixed. Never add `superpowers:` / `superpony:` prefixes.
- Overlays = thin `🐴 Ponytail overlay (Superpony)` blocks on `writing-plans`,
  `executing-plans`, `requesting-code-review`, `test-driven-development`. Each carries
  its **local scope cap** (survives direct/subagent entry) and defers to root for canon.
  Keep them thin — add the cap, reference root, don't restate the policy.

## Hooks

- Node hooks resolve paths via `$CLAUDE_PROJECT_DIR` (in `settings.json`) and `__dirname`
  (inside hook modules). Never hardcode plugin paths.
- `superpony-instructions.js` reads the injection live from the skill files — so editing
  the root skill updates the injection; don't fork the text into the hook.
- Default mode: `SUPERPONY_DEFAULT_MODE` env → `full`. Modes: `off|lite|full|ultra`.
- `.claude/.superpony-mode` is per-project **runtime state**, git-ignored. Never commit it.
- Known: if the upstream `superpowers` plugin is also installed globally, `using-superpowers`
  is injected twice per session (superpony's hook + the plugin's). Harmless duplication.

## Hygiene

- UTF-8 for all files. Git commits and technical messages in English.
- When editing skills/hooks, keep policy canonical in root; verify overlays still defer.
- Both parents are MIT; keep attribution in README.
