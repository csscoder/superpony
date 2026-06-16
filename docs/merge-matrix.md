# Superpony — Merge Matrix

Which phase takes what from which parent, and the exact overlay we inject.

| Phase | Source skill (parent) | From Superpowers | From Ponytail (overlay) | Edited? |
|-------|----------------------|------------------|--------------------------|---------|
| Root  | `superpony` (new)    | Pipeline, phase gating, "stop when blocked" | Decision ladder, hard constraints, carve-outs, intensity levels | NEW file |
| 0. Frame | `brainstorming`   | Socratic refinement, worktree setup | (applied via root: challenge the requirement) | verbatim |
| 1. Plan  | `writing-plans`   | Bite-sized tasks, exact paths, no placeholders | Minimal Solution Hypothesis, "Why not smaller?", Rejected approaches | **overlay added** |
| 2. Build | `executing-plans` | Load → review → execute → report | No scope creep, `// ponytail:` markers, escalation rule | **overlay added** |
| 3. Test  | `test-driven-development` | RED-GREEN-REFACTOR | (applied via root: ONE check, YAGNI on tests) | verbatim |
| 4. Debug | `systematic-debugging` | 4-phase root cause | (applied via root: smallest fix) | verbatim |
| 5. Review| `requesting-code-review` + `ponytail-review` | Correctness/security pass | Over-engineering pass, `net: -N lines` | **overlay added** |
| 6. Finish| `finishing-a-development-branch` | Merge/PR decision | (applied via root: smallest PR) | verbatim |

## Verbatim skills carried over

**Superpowers (process):** brainstorming, dispatching-parallel-agents, finishing-a-development-branch, receiving-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-skills.

**Ponytail (minimization):** ponytail, ponytail-audit, ponytail-debt, ponytail-help, ponytail-review.

## Conflict resolution principle

> Do NOT mix the two value systems at the same level of detail.

- The **root skill** declares global policy (minimization is the default objective).
- **Phase skills** carry process; overlays add scope constraints only where minimalism matters (plan, build, review).
- Everything else stays verbatim so upstream updates re-sync cleanly via `vendor/`.

## Resolved tensions

| Superpowers tendency | Ponytail tendency | Superpony resolution |
|---|---|---|
| "comprehensive plan, assume zero context" | "smallest viable change" | Comprehensive = *complete & unambiguous*, not *large*. Minimal plan with exact code. |
| "design units, clear interfaces, split files" | "fewest files, no abstraction w/ one impl" | Follow existing patterns; new files only when current structure can't absorb the change. |
| "scaffold tests thoroughly" | "ONE runnable check, YAGNI on tests" | Non-trivial logic → one check. No fixtures/frameworks unless asked. |

## TODO (polish backlog)

- [ ] Session-start hook that injects the root `superpony` bootstrap (per-harness: Claude Code / Codex / OpenCode).
- [ ] Slash commands: `/superpony`, `/superpony-review`, `/superpony-debt`.
- [ ] Eval harness (promptfoo) measuring LOC + process-adherence vs each parent alone.
- [ ] Decide: keep root-orchestrator approach vs deeper per-skill overlays.
- [ ] Test the acceptance prompt "Let's make a react todo list" — brainstorming must auto-trigger, then minimal output.
