# 🦄🐴 Superpony

**Superpowers process discipline × Ponytail lazy-senior minimalism — fused into one skill tree.**

> Be thorough in reasoning. Be minimal in changes.

This is a **work-in-progress hybrid** combining two AI-agent skill systems:

- [`obra/superpowers`](https://github.com/obra/superpowers) — the *HOW to work* layer: brainstorm → plan → execute → test → review → finish, sub-agents, TDD, verification.
- [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail) — the *HOW MUCH to build* layer: YAGNI, stdlib/native-first, smallest viable diff, no speculative abstractions.

They never fight because they answer **different questions**. Superpony wires them together so process rigor and code frugality reinforce each other instead of pulling apart.

## Why fuse them

| Problem with each alone | Superpony fix |
|---|---|
| Superpowers alone → disciplined but can over-engineer (scaffolding, abstractions, big diffs) | Ponytail ladder caps the footprint at every phase |
| Ponytail alone → minimal but undisciplined (no plan, no verification gate, scope drift) | Superpowers pipeline adds plan → test → review → finish |

## Layout

```
superpony/
├─ skills/                  # FUSED skill tree (this is what agents load)
│  ├─ superpony/            # ← root orchestrator (start here)
│  ├─ writing-plans/        # superpowers + ponytail overlay
│  ├─ executing-plans/      # superpowers + ponytail overlay
│  ├─ requesting-code-review/ # superpowers + ponytail overlay
│  ├─ ponytail*/            # ponytail minimization skills (verbatim)
│  └─ ...                   # all other superpowers skills (verbatim)
├─ vendor/                  # pristine upstream copies — reference only, never edited
│  ├─ superpowers/
│  └─ ponytail/
├─ hooks/                   # session-start activation (WIP)
├─ docs/                    # design notes, merge matrix
└─ commands/                # slash-command defs (WIP)
```

`vendor/` lets us diff our overlays against upstream and re-sync when either project updates.

## The single decision rule

For any task:

1. **Process gate (Superpowers):** trivial → just do it (leave one check if logic non-obvious); non-trivial → run the full pipeline.
2. **Scope gate (Ponytail ladder):** before writing anything, stop at the first rung that holds —
   `YAGNI → stdlib → native feature → installed dep → one line → minimal custom code`.

Full rules: [`skills/superpony/SKILL.md`](skills/superpony/SKILL.md).

## Status

🚧 **v0.1.0 — raw fusion.** Skills merged, overlays added to plan/execute/review. Next: hooks, slash commands, eval harness, polishing per real-world use.

See [`docs/merge-matrix.md`](docs/merge-matrix.md) for what each phase takes from which parent.

## License

MIT (both parents are MIT).
