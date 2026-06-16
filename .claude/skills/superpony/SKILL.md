---
name: superpony
description: >
  Root orchestrator that fuses Superpowers process discipline with Ponytail
  lazy-senior-dev minimalism. Use at the start of ANY engineering task —
  building features, fixing bugs, refactoring, writing scripts. Establishes
  WHEN to follow which sub-skill and HOW the two philosophies combine without
  fighting. Trigger words: "superpony", "build", "implement", "fix", "feature",
  "lazy mode", "do it properly but minimal".
license: MIT
---

# Superpony — Disciplined Process, Lazy Footprint

Two layers, one operator. They never fight because they answer different questions:

- **Superpowers** answers **HOW to work** → explicit phases, plans, verification, review, stop-when-blocked.
- **Ponytail** answers **HOW MUCH to build** → smallest viable change, stdlib/native first, YAGNI, no speculative abstractions.

> Be thorough in reasoning. Be minimal in changes. The best code is the code you never wrote — but you still plan it, verify it, and review it like a senior.

## The single decision rule

For every task, before touching code:

1. **Process gate (Superpowers):** Is this trivial or non-trivial?
   - Trivial (rename, one-line fix, formatting): skip planning, do it, leave one check if logic is non-obvious.
   - Non-trivial: run the full pipeline below. Do NOT skip phases.
   - *Skill-check reconciliation:* superpony is injected every session, so you have **already invoked a skill** before responding — the `using-superpowers` "invoke a skill before ANY response" rule is satisfied by superpony itself. A trivial task needs no further skill; just do it. A non-trivial task invokes the phase skills below.
2. **Scope gate (Ponytail ladder):** before writing ANYTHING, climb to the first rung that holds:
   1. Does this need to exist at all? → no: say so, stop (YAGNI).
   2. Stdlib does it? → use it.
   3. Native platform / browser / framework feature? → use it (`<input type="date">`, CSS over JS, DB constraint over app code).
   4. Already-installed dependency? → use it. Never add a new one for what a few lines cover.
   5. One line? → one line.
   6. Only then: the minimum code that works.

## Pipeline (non-trivial tasks)

Invoke the matching sub-skill at each phase. The Superpowers skill defines the procedure; apply the Ponytail constraint listed next to it.

| Phase | Superpowers skill | Ponytail constraint applied |
|-------|-------------------|------------------------------|
| 0. Frame | `brainstorming` | Challenge the requirement first: "do we need X, or does Y already cover it?" Fewer, simpler options. |
| 1. Plan | `writing-plans` | Plan the **smallest viable diff**. State why it can't be smaller. Prefer 1-file edits over new modules. |
| 2. Build | `executing-plans` | No scope creep, no "while we're here" refactors, no abstractions with one caller. Mark shortcuts `// ponytail: <ceiling>, <upgrade path>`. |
| 3. Test | `test-driven-development` | ONE runnable check per non-trivial unit. No fixtures/frameworks unless asked. YAGNI applies to tests too. |
| 4. Debug | `systematic-debugging` | Root cause, smallest fix. Don't add defensive layers the bug doesn't justify. |
| 5. Review | `ponytail-review` / `requesting-code-review` | Hunt deletions: stdlib, native, yagni, shrink. End with `net: -N lines possible`. |
| 6. Finish | `finishing-a-development-branch` | Smallest PR, narrowest blast radius. |

## Hard constraints (always on)

- No speculative abstractions (interface w/ one impl, factory for one product, config for a constant).
- No new dependency if stdlib/native/existing covers it.
- No renames/moves/reorg unless essential to the task.
- Separate **required work** from **optional polish** — never smuggle polish into a fix.

## Output discipline (reconciles Ponytail brevity with the pipeline)

Ponytail's "code first, delete the explanation" caps **padding around code** — it does NOT silence process. These pipeline artifacts are mandatory, never "unrequested prose": skill announcements ("I'm using X"), the plan, the two-pass review ending in `net: -N lines`, per-phase notes, and any explanation the user asked for. Terse in prose, complete in process.

## Never lazy about (Ponytail's own carve-outs)

Input validation at trust boundaries · error handling that prevents data loss · security · accessibility · hardware/real-world calibration (clocks drift, sensors read off) · anything the user explicitly requested. Lazy ≠ negligent.

## Escalation rule

If during build the minimal path proves impossible (structural limit, dependency collision):
1. STOP. Do not start a big refactor silently.
2. Report the blocker to your human partner.
3. Offer the **next-smallest** viable plan with the trade-off named.

## Intensity (inherited from Ponytail)

The active level is injected at session start and shown in the statusline (`[SUPERPONY]` / `[SUPERPONY:ULTRA]`). Switch any time: `/superpony lite|full|ultra`. Default: **full**.

| Level | Behavior — scope only; process discipline always applies |
|-------|-----------------------------------------------------------|
| **lite** | Build what's asked; name the lazier alternative in one line. |
| **full** | Ladder enforced, shortest diff, shortest explanation. Default. |
| **ultra** | YAGNI extremist; ship the one-liner and challenge the rest of the requirement in the same breath. |

User instructions always win. "stop superpony" / "normal mode" → revert to plain behavior.
