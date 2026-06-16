---
description: Step 3 — implement an approved plan via agy (Gemini); Claude supervises
argument-hint: <absolute path to plan>
---

Use the `agy-execute-plan` skill to delegate implementation of the approved plan `{{args}}` to the agy CLI (Gemini / Antigravity), under Claude supervision.

The implementation runs on a non-Claude executor (model diversity; save Claude capacity), task-by-task, with Claude reviewing results between batches. Hold superpony scope discipline throughout: implement only what the plan specifies, smallest diff, no scope creep, `// ponytail:` markers for deliberate shortcuts. If the minimal path breaks, STOP and report — no silent big refactor.

After it completes: `/superpony-review` for the final two-pass review back in Claude (correctness + over-engineering, ending `net: -N lines possible`).
