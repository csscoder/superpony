---
name: ponytail-help
description: >
  Quick-reference card for superpony's minimization (ponytail) modes, skills,
  and commands. One-shot display, not a persistent mode. Trigger:
  "ponytail help", "superpony help", "lazy mode commands",
  "what superpony commands", "how do I use superpony".
license: MIT
---

# Superpony — Minimization Reference

Display this card when invoked. One-shot: do NOT change mode, write flag files,
or persist anything. (For the whole fused system, see `/superpony-help`.)

## Intensity levels

| Level | Trigger | What changes |
|-------|---------|--------------|
| **Lite** | `/superpony lite` | Build what's asked, name the lazier alternative in one line. |
| **Full** | `/superpony` | The ladder enforced: YAGNI → stdlib → native → installed dep → one line → minimum. Default. |
| **Ultra** | `/superpony ultra` | YAGNI extremist. Deletion before addition. Challenges requirements before building. |

Level sticks until changed or session end, and shows in the statusline as `[SUPERPONY]` / `[SUPERPONY:ULTRA]`.

## Minimization skills & commands

| Skill | Command | What it does |
|-------|---------|--------------|
| **ponytail** | `/superpony` | Lazy mode itself. Simplest solution that works. |
| **ponytail-review** | `/superpony-review` | Over-engineering review: `L42: yagni: factory, one product. Inline.` |
| **ponytail-audit** | `/superpony-audit` | One-shot bloat report on existing code. |
| **ponytail-debt** | `/superpony-debt` | Ledger of `ponytail:` shortcuts and their upgrade paths. |
| **ponytail-help** | `/superpony-help` | Reference cards. |

## Deactivate

Say "stop superpony" or "normal mode". Resume anytime with `/superpony`.
`/superpony off` also works.

## Configure the default mode

Default mode = `full`, auto-active every session. Override with an environment
variable (set `off` to start inactive and activate manually with `/superpony`):

```bash
export SUPERPONY_DEFAULT_MODE=ultra   # off | lite | full | ultra
```

Resolution: `SUPERPONY_DEFAULT_MODE` env var > `full`.

## Install in another project

superpony is project files, not a plugin. Copy `.claude/` into the target
project (`cp -r .claude /path/to/project/`). The SessionStart hook activates it
on the next session; no marketplace install needed.

## More

superpony fuses [ponytail](https://github.com/DietrichGebert/ponytail)
(minimalism) and [superpowers](https://github.com/obra/superpowers) (process).
