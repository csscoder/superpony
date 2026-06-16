# Superpony — Merge Matrix

What each phase takes from which parent, and exactly how the conflicts were resolved.
`.claude/skills/` is the single source of truth — superpony is standalone, maintained
directly, with no upstream re-sync.

## Architecture

Root orchestrator + targeted overlays.

- **Root skill** (`superpony`) declares ALL canonical policy: the decision rule, the
  pipeline, hard constraints, output discipline, carve-outs, escalation, intensity.
- **Overlays** are thin `🐴 Ponytail overlay (Superpony)` blocks prepended to four
  footprint-critical skills. Each carries its **local scope cap** so it survives direct
  or subagent entry, then defers to the root for canon. Overlays do NOT restate the
  whole policy.
- **Everything else** stays unmodified.

## Phase → skill → ponytail constraint

| Phase | Skill | Ponytail constraint | Overlay? |
|-------|-------|---------------------|----------|
| 0. Frame  | `brainstorming`             | Challenge the requirement; fewer, simpler options. | via root |
| 1. Plan   | `writing-plans`             | Minimal Solution Hypothesis, "Why not smaller?", Rejected approaches, 1-file edits preferred. | **overlay** |
| 2. Build  | `executing-plans`           | No scope creep / "while we're here" refactors; `// ponytail:` markers; escalation rule. | **overlay** |
| 3. Test   | `test-driven-development`   | One runnable check = GREEN minimum; no fixtures/frameworks unless asked; never delete the check. | **overlay** |
| 4. Debug  | `systematic-debugging`      | Root cause, smallest fix; no defensive layers the bug doesn't justify. | via root |
| 5. Review | `requesting-code-review` + `ponytail-review` | Correctness pass, then over-engineering pass; end `net: -N lines possible`. | **overlay** |
| 6. Finish | `finishing-a-development-branch` | Smallest PR, narrowest blast radius. | via root |

## Skills carried over (unmodified)

**Superpowers (process):** brainstorming, dispatching-parallel-agents,
finishing-a-development-branch, receiving-code-review, subagent-driven-development,
systematic-debugging, using-git-worktrees, using-superpowers,
verification-before-completion, writing-skills.

**Ponytail (minimization):** ponytail, ponytail-audit, ponytail-debt, ponytail-help,
ponytail-review.

## Resolved tensions

| Superpowers tendency | Ponytail tendency | Superpony resolution |
|---|---|---|
| comprehensive plan, assume zero context | smallest viable change | Comprehensive = *complete & unambiguous*, not *large*. Minimal plan with exact code. |
| design units, clear interfaces, split files | fewest files, no abstraction w/ one impl | Follow existing patterns; new file only when current structure can't absorb the change. |
| scaffold tests thoroughly | one runnable check, YAGNI on tests | Non-trivial logic → one check; no fixtures/frameworks unless asked. |

## Conflict fixes baked in

- **Skill-check vs trivial path** (root): superpony is injected every session, so a skill
  is already invoked before any response — the `using-superpowers` "invoke before ANY
  response" rule is satisfied by superpony itself. Trivial tasks need no further skill.
- **`writing-plans` self-contradiction** (overlay): the overlay's "1-file edits" vs the
  skill's "split into focused files" reconciled in the overlay — a new file only when the
  existing structure genuinely can't absorb the change; "smaller files" is a tie-breaker
  within a needed change, not a license to fan out.
- **TDD cap** (overlay): one runnable check is the GREEN minimum; no fixtures/frameworks
  unless asked; never skip or delete the mandated check.
- **Brevity vs process artifacts** (root, "Output discipline"): "code first, delete the
  explanation" caps padding around code, not process. Skill announcements, the plan,
  the two-pass review ending `net: -N lines`, and per-phase notes are mandatory.
- **Namespace** (everywhere): all cross-references are bare-name (no `superpowers:` /
  `superpony:` prefixes), because project skills are invoked unprefixed. Ponytail's
  `/ponytail*` command advertising was rewritten to `/superpony*`.
