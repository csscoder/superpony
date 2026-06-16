---
description: Audit existing code for over-engineering and removable complexity
argument-hint: [path, optional — defaults to working tree]
---

Use the `ponytail-audit` skill to audit `{{args}}` (default: the current changes / working tree) for over-engineering: speculative abstractions, unused or avoidable dependencies, boilerplate, files that could merge, and code the stdlib or a native/framework feature already covers.

Report findings as concrete deletions with estimated line savings. Do not change code unless asked.
