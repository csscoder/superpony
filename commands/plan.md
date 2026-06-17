---
description: Step 2 — turn an approved spec into a bite-sized plan via writing-plans (Claude)
argument-hint: [spec path, optional]
---

Use the `superpony:writing-plans` skill to turn the approved spec (`{{args}}`, or the latest under `docs/superpony/specs/`) into an implementation plan.

- Apply the 🐴 Ponytail overlay: **Minimal Solution Hypothesis** first, "why not smaller?", rejected approaches, smallest viable diff, exact file paths + complete code, no placeholders.
- Bite-sized tasks (2-5 min each). Save to `docs/superpony/plans/YYYY-MM-DD-<feature>.md` and STOP for my approval.

Pipeline: brainstorming → check → **plan (here)** → `/superpony:check <plan>` (Gemini review) → `/superpony:build <plan>` (Gemini) → `/superpony:review` (Claude).
