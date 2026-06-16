---
description: Two-pass review — correctness then over-engineering (net: -N lines)
argument-hint: [path or git range, optional]
---

Review the current diff (or `{{args}}` if a path/range is given) in TWO separate passes — keep them separate, never merge:

1. **Correctness pass:** bugs, security, requirements coverage, data-loss and edge cases.
2. **Over-engineering pass** (use the `superpony:ponytail-review` skill): hunt deletions only — `delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`. Never flag the single mandated runnable check for deletion.

End with one line: `net: -N lines possible`.
