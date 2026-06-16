---
description: Cross-model gate — independent review of a spec or plan via agy (Gemini)
argument-hint: <absolute path to spec or plan>
---

Use the `agy-review-plan` skill to get an independent external review of `{{args}}` on a non-Claude model (Gemini, via the agy CLI, detached).

This is the cross-vendor gate: the doc was authored by Claude, so a Gemini reviewer catches blind spots a Claude-reviewing-Claude pass would miss. Pass the **absolute** path.

When it returns: surface the verdict (APPROVE / APPROVE_WITH_FIXES / REVISE / BLOCK) and every finding. Apply the `superpony:receiving-code-review` discipline — verify each finding, push back on the wrong ones with reasoning, never hide them — then fix before the next step.

Use after `/superpony:spec` (check the spec) and after `/superpony:plan` (check the plan).
