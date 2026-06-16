---
description: Explain superpony — what it is, modes, commands, when each skill fires
---

Explain superpony to the user, concisely:

- **What it is:** Superpowers process discipline × Ponytail lazy-senior minimalism, fused. "Be thorough in reasoning, minimal in changes. The best code is the code you never wrote — but you still plan it, verify it, and review it."
- **Single decision rule:** process gate (trivial → just do it; non-trivial → full pipeline) + scope ladder (YAGNI → stdlib → native/framework → installed dep → one line → minimal custom code).
- **Intensity:** `lite` / `full` (default) / `ultra`. Switch: `/superpony lite|full|ultra`. Disable: `/superpony off`, "stop superpony", or "normal mode". Active mode shows in the statusline as `[SUPERPONY]` / `[SUPERPONY:ULTRA]`.
- **Cross-model pipeline (explicit, Claude ↔ Gemini):**
  `/superpony-spec` (spec, Claude) → `/superpony-check <spec>` (review on Gemini) → `/superpony-plan` (plan, Claude) → `/superpony-check <plan>` (review on Gemini) → `/superpony-build <plan>` (implement on Gemini) → `/superpony-review` (final review, Claude).
- **Control commands:** `/superpony [mode]` (intensity), `/superpony-review` (two-pass code review), `/superpony-audit` (bloat scan), `/superpony-debt` (shortcut ledger), `/superpony-help`.
- **Auto-trigger skills (no command needed):** brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, requesting-code-review / ponytail-review, finishing-a-development-branch.

Keep it short — match superpony's own brevity.
