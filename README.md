# 🦄🐴 Superpony

**English** · [Русский](README.ru.md)

**Superpowers process discipline × Ponytail senior-dev lazy minimalism — fused into one skill tree for Claude Code.**

> Thorough in reasoning. Minimal in changes. The best code is the code you never wrote — but you still planned, verified, and reviewed it like a senior.

Two parents, two questions:

- [`obra/superpowers`](https://github.com/obra/superpowers) — **HOW to work**: brainstorm → plan → execute → test → review → finish, subagents, TDD, verification, stop-when-blocked.
- [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail) — **HOW MUCH to build**: YAGNI, stdlib/native-first, shortest working diff, no speculative abstractions.

They answer different questions, so they don't conflict. Superpony binds them so that rigor and frugality reinforce each other.

| On its own | Weak spot | Superpony fix |
|---|---|---|
| Superpowers | discipline, but prone to over-engineering (scaffolding, abstractions, large diffs) | Ponytail's ladder caps footprint at every phase |
| Ponytail | minimalism, but no discipline (no plan, no verification gate, scope drift) | Superpowers' pipeline adds plan → test → review → finish |

## The single decision rule

For any task, before touching code:

1. **Process gate (Superpowers):** trivial (rename, one-line fix, formatting) → just do it, leave one check if the logic is non-obvious. Non-trivial → full pipeline, no skipped phases.
2. **Scope gate (Ponytail ladder):** stop at the first rung that holds —
   `YAGNI → stdlib → native/framework feature → installed dep → one line → minimal custom code`.

Canonical policy: [`skills/superpony/SKILL.md`](skills/superpony/SKILL.md).

## Install

Superpony is a **Claude Code plugin**, installed and updated through a git marketplace:

```sh
/plugin marketplace add https://github.com/csscoder/superpony
/plugin install superpony@superpony
```

Update across all projects at once: `/plugin update superpony`.

The `SessionStart` hook activates the policy from the next session — it injects the root policy + skill bootstrap. Skills and commands are namespaced: `superpony:writing-plans`, `/superpony:review`. Skill-invocation directives carry the `superpony:` prefix; bare names stay in prose only.

Requires `node` in PATH (without it the hooks silently no-op).

Local plugin development: `claude --plugin-dir /path/to/superpony`.

> The `[SUPERPONY]` statusline is optional: the plugin can't set `statusLine` itself. To show the active mode, add a command pointing to `<plugin-install-path>/hooks/superpony-statusline.sh` in your own `settings.json`.

## Antigravity (agy)

Superpony also runs inside the **Antigravity CLI (`agy`)** as a native plugin + an always-on rule.

**1. Install the skill suite (plugin):**

```bash
agy plugin install https://github.com/csscoder/superpony
```

(Or from a local checkout: `agy plugin install /path/to/superpony`.)

**2. Apply the policy to every task (rule).** Add one line to `~/.gemini/GEMINI.md`:

```
@config/plugins/superpony/antigravity/rules/superpony.md
```

That imports the **full** policy globally. To change intensity, swap the filename to
`superpony-lite.md` (lite) or `superpony-ultra.md` (ultra). Keep exactly one such line.

**Per-project override** — copy one rule file into the workspace instead of (or on top of) the global import:

```bash
mkdir -p .agents/rules
cp ~/.gemini/config/plugins/superpony/antigravity/rules/superpony-ultra.md .agents/rules/superpony.md
```

Its `trigger: always_on` frontmatter activates it in that workspace.

**Limitations vs Claude Code (v1):**
- No ephemeral `/superpony:mode` toggle — intensity is whichever rule file you import/copy (`agy` has no context-injecting hook).
- Pipeline commands (`spec/check/plan/build/review/mode/audit/debt/help`) are Claude-first. agy auto-converts `commands/` into bare-named skills on install, so they also surface in agy — but they're inert there (the always-on rule carries the policy; `build`/`check` would just re-invoke agy). Use the skills, not these.

## Modes and commands

Intensity controls how aggressively to minimize and how tersely to answer. **Process discipline is always on.** Default is `full`. Override the default via `SUPERPONY_DEFAULT_MODE`.

| Mode | Behavior — scope only |
|---|---|
| `lite` | Build what's asked; name the lazier alternative in one line. |
| `full` | Ladder enforced, shortest diff, shortest explanation. Default. |
| `ultra` | YAGNI extremist; ship the one-liner and challenge the rest of the requirement in the same breath. |

Switch: `/superpony:mode lite|full|ultra`. Turn off: `/superpony:mode off`, `stop superpony`, or `normal mode`.

### Cross-model pipeline (explicit gates)

Write on Claude, review and implement on Gemini, final review back on Claude. Every gate is manual — you trigger the next step:

```
/superpony:spec  "feature"   # 1. spec            Claude · brainstorming
/superpony:check <spec>      # 2. review          Gemini · agy-review-plan
/superpony:plan              # 3. plan            Claude · writing-plans
/superpony:check <plan>      # 4. review          Gemini · agy-review-plan
/superpony:build <plan>      # 5. implementation  Gemini · agy-execute-plan
/superpony:review            # 6. review          Claude · two-pass
```

The Gemini legs reuse your `agy-review-plan` / `agy-execute-plan` skills (requires the `agy` CLI). Claude only? Skip `-build` — the plan runs right in the session (executing-plans / subagent-driven-development).

### All commands

| Command | What it does |
|---|---|
| `/superpony:mode [mode]` | Activate / switch intensity (`lite\|full\|ultra\|off`). |
| `/superpony:spec [topic]` | Write a design spec (Claude · brainstorming). |
| `/superpony:plan [spec]` | Turn an approved spec into a bite-sized plan (Claude · writing-plans). |
| `/superpony:check <path>` | Independent review of a spec/plan on Gemini (agy-review-plan). |
| `/superpony:build <plan>` | Implement an approved plan on Gemini (agy-execute-plan). |
| `/superpony:review` | Two-pass code review on Claude: correctness, then over-engineering, ending in `net: -N lines possible`. |
| `/superpony:audit` | Audit existing code for over-engineering and removable complexity. |
| `/superpony:debt` | List `ponytail:` shortcuts as a debt ledger with upgrade paths. |
| `/superpony:help` | Explain superpony: what it is, modes, commands, pipeline. |

## Structure

```
superpony/                       # repository = plugin + marketplace
├─ .claude-plugin/               # plugin manifests
│  ├─ plugin.json
│  └─ marketplace.json
├─ skills/                       # single source of truth (fused tree)
│  ├─ superpony/                 # root orchestrator — canonical policy
│  ├─ writing-plans/             # + 🐴 ponytail overlay
│  ├─ executing-plans/           # + 🐴 ponytail overlay
│  ├─ requesting-code-review/    # + 🐴 ponytail overlay
│  ├─ test-driven-development/   # + 🐴 ponytail overlay
│  ├─ ponytail*/                 # ponytail minimization skills
│  └─ ...                        # remaining superpowers skills
├─ hooks/                        # node + bash + hooks.json (lib, activate, mode-tracker, statusline)
├─ commands/                     # /superpony:* slash commands
├─ docs/                         # design spec + merge matrix + plan
└─ eval/                         # promptfoo harness (superpony vs each parent)
```

## How conflicts are resolved

Canonical policy lives **only** in the root skill. Overlays add a scope cap on footprint-critical phases and carry a local cap so it survives direct/subagent entry; they don't restate the whole policy.

| Tension | Resolution |
|---|---|
| "invoke a skill before ANY response" vs the trivial path | superpony is injected every session → that satisfies the skill check; a trivial task needs no further skill. |
| "exhaustive plan" vs "smallest viable change" | Exhaustive = *complete and unambiguous*, not *large*. Minimal plan, precise code. |
| "split into focused files" vs "1-file edits" (inside `writing-plans`) | New file only when the current structure can't hold the change; "fewer files" is a tie-breaker within the needed change, not a license to proliferate. |
| "scaffold tests" vs "YAGNI on tests" | One runnable check — the GREEN minimum; no fixtures/frameworks until asked; never delete a mandated check. |
| "code first, delete the explanation" vs process artifacts | Skill announcements, plans, review reports, per-phase notes are mandatory — not "unrequested prose". Terse in prose, complete in process. |
| namespace prefixes | Skill-invocation directives carry `superpony:`; bare names in prose only. `/ponytail*` advertising rewritten to `/superpony:*`. |

Full reference: [`docs/merge-matrix.md`](docs/merge-matrix.md).

## Eval

A `promptfoo` harness compares superpony vs superpowers-only vs ponytail-only (one model, different system prompts) on identical coding tasks, scoring `process`, `brevity` (LOC), and `minimalism`. Plus a manual acceptance test ([`eval/acceptance/react-todo-list.md`](eval/acceptance/react-todo-list.md)): brainstorming must auto-trigger, then a minimal implementation.

```sh
export ANTHROPIC_API_KEY=sk-ant-...
npm run eval        # or: npx --yes promptfoo@latest eval -c eval/promptfooconfig.yaml
```

Details: [`eval/README.md`](eval/README.md).

## License

MIT. Both parents are MIT.
