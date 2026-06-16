---
description: Step 1 — write a design spec via brainstorming (Claude)
argument-hint: [feature/topic]
---

Use the `superpony:brainstorming` skill to turn "{{args}}" into a validated design spec.

- Apply superpony scope discipline: challenge the requirement first (does X need to exist? does Y already cover it?), prefer the smallest viable design, propose 2-3 approaches with a recommendation.
- One question at a time; converge on architecture, components, data flow, error handling, testing.
- Save the spec to `docs/superpony/specs/YYYY-MM-DD-<topic>-design.md` and STOP for my approval.

Pipeline: **spec (here)** → `/superpony:check <spec>` (Gemini review) → `/superpony:plan` → `/superpony:check <plan>` → `/superpony:build <plan>` (Gemini) → `/superpony:review` (Claude).
