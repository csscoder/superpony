# Superpony — Claude Code design spec

Date: 2026-06-16
Status: implemented (v0.1.0)

Design deliverable from the brainstorming phase: how to fuse Superpowers and Ponytail
into one Claude Code skill tree without the two value systems fighting.

## Problem

Two skill systems, each strong and each incomplete:

- **Superpowers** — process discipline (brainstorm → plan → execute → test → review →
  finish, subagents, TDD, verification). Disciplined, but tends to over-engineer:
  scaffolding, abstractions, large diffs.
- **Ponytail** — lazy-senior minimalism (YAGNI, stdlib/native-first, smallest viable
  diff). Frugal, but undisciplined: no plan, no verification gate, scope drift.

Naïvely concatenating them produces contradictions ("scaffold tests" vs "YAGNI on
tests"; "split into focused files" vs "1-file edits"; "invoke a skill before ANY
response" vs "just do the one-liner"). Goal: a single operator where process rigor and
code frugality reinforce each other, with every contradiction resolved in the artifact.

## The four brainstorming decisions

### 1. Identity — project files, not a plugin; bare-name refs

> **Update 2026-06-16 (superseded):** Decision #1 reversed — superpony now ships as a Claude Code plugin (`.claude-plugin/plugin.json` + `marketplace.json`) for one-source install/update across projects. Skill-invocation directives are now `superpony:`-prefixed; bare-name remains only in prose. See `docs/superpony/plans/2026-06-16-superpony-as-plugin.md`.

Superpony ships as the `.claude/` directory, copied into any project
(`cp -r .claude /path/to/project/`). No marketplace, no `plugin.json`. A plugin would
force a `superpony:` invocation prefix; project skills are invoked unprefixed, so all
cross-references between skills are **bare-name** (`executing-plans`, `ponytail-review`).

### 2. Architecture — root orchestrator + targeted overlays

Canonical policy lives in **one** place: `.claude/skills/superpony/SKILL.md` (the
decision rule, pipeline, hard constraints, output discipline, carve-outs, escalation,
intensity). Thin `🐴 Ponytail overlay (Superpony)` blocks are prepended only to the four
footprint-critical skills — `writing-plans`, `executing-plans`,
`requesting-code-review`, `test-driven-development`. Each overlay carries its **local
scope cap** so the cap survives direct or subagent entry, then defers to the root for
canon. Overlays do not restate the whole policy (no duplication to drift). All other
skills are unmodified.

### 3. Full machinery — node hooks adapted to non-plugin project paths

Ported from Ponytail, rewired to `$CLAUDE_PROJECT_DIR` (settings.json) and `__dirname`
(hook modules) instead of plugin paths:

- **SessionStart** (`superpony-activate.js`): resolves mode, injects root policy +
  `using-superpowers` bootstrap (read live from the skill files, so the injection never
  drifts), wrapped in `<EXTREMELY_IMPORTANT>` with a mode banner. `off` → clear flag,
  stay silent. Nudges to wire the statusline if the project lacks one.
- **UserPromptSubmit** (`superpony-mode-tracker.js`): detects `/superpony [lite|full|
  ultra|off]` and `stop superpony` / `normal mode`; writes the per-project flag
  `.claude/.superpony-mode` (git-ignored runtime state); re-injects policy on change.
  A lookahead excludes `/superpony-review` and friends from the intensity toggle.
- **statusLine** (`superpony-statusline.sh`): shows `[SUPERPONY]` / `[SUPERPONY:ULTRA]`.
- **Default mode resolution**: `SUPERPONY_DEFAULT_MODE` env var → `full`. Ponytail's
  XDG `config.json` lookup was dropped as YAGNI (env var + flag file cover switching).

Supporting modules: `superpony-config.js` (mode resolution), `superpony-runtime.js`
(flag I/O + hook output), `superpony-instructions.js` (builds the injection).

### 4. Eval — promptfoo

A `promptfoo` harness under `eval/` compares three variants (same model, three system
prompts: `superpony`, `superpowers`, `ponytail`) on identical coding tasks, scoring
`process` (rubric), `brevity` (deterministic LOC of code blocks), and `minimalism`
(rubric). Expectation: superpony beats ponytail on process and beats superpowers on
brevity/minimalism. Plus a manual acceptance test
(`eval/acceptance/react-todo-list.md`): "Let's make a react todo list" must
auto-trigger brainstorming first, then a minimal implementation.

## Conflict inventory + resolutions

| Conflict | Resolution | Where |
|---|---|---|
| "invoke a skill before ANY response" vs trivial path | superpony injected every session satisfies the skill-check; trivial tasks need no further skill. | root |
| "comprehensive plan" vs "smallest viable change" | Comprehensive = complete & unambiguous, not large. Minimal plan with exact code. | `writing-plans` overlay + root |
| "split into focused files" vs "1-file edits" | New file only when existing structure can't absorb the change; "smaller files" is a tie-breaker within a needed change. | `writing-plans` overlay |
| "scaffold tests" vs "YAGNI on tests" | One runnable check = GREEN minimum; no fixtures/frameworks unless asked; never delete the check. | `test-driven-development` overlay |
| "code first, delete the explanation" vs process artifacts | Skill announcements, plans, review reports, per-phase notes are mandatory, not "unrequested prose". | root "Output discipline" |
| namespace prefixes | All refs bare-name; `/ponytail*` advertising rewritten to `/superpony*`. | everywhere |

## Intensity modes

`lite` / `full` (default) / `ultra`; `stop superpony` / `normal mode` / `/superpony off`
disable. Modes tune minimization aggressiveness and verbosity only — process discipline
always applies.

## Final layout

```
.claude/
  skills/                       # single source of truth
    superpony/SKILL.md          # root orchestrator (canonical policy)
    writing-plans/              # + overlay
    executing-plans/            # + overlay
    requesting-code-review/     # + overlay
    test-driven-development/    # + overlay
    ponytail, ponytail-*/       # ponytail minimization skills
    ...                         # other superpowers skills (unmodified)
  hooks/
    superpony-activate.js       # SessionStart
    superpony-mode-tracker.js   # UserPromptSubmit
    superpony-instructions.js   # builds injection from skill files
    superpony-config.js         # default-mode resolution
    superpony-runtime.js        # flag I/O + hook output
    superpony-statusline.sh     # [SUPERPONY] badge
  commands/                     # /superpony, -review, -audit, -debt, -help
  settings.json                 # hooks + statusLine
docs/                           # this spec + merge-matrix.md
eval/                           # promptfoo harness + acceptance test
```

## Deferred / dropped

- **`vendor/` + upstream re-sync** — dropped. Superpony is standalone, maintained
  directly; `.claude/skills/` is the only source of truth.
- **Plugin packaging (`plugin.json`, marketplace)** — out of scope by design; project
  files are the distribution unit. *(Reversed 2026-06-16 — see note under §1.)*
- **Ponytail XDG `config.json`** — dropped as YAGNI; env var + flag file suffice.
- **Per-machine persisted default** — add a `config.json` resolver in
  `superpony-config.js` if ever needed.
