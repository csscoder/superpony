# Superpony eval harness

Measures the superpony thesis: **process discipline of superpowers + brevity of ponytail.**
It compares three variants on the same coding tasks and expects superpony to beat
ponytail on process AND beat superpowers on brevity.

The three variants are the **same model** with **different system prompts**:

| Variant | System prompt | What it represents |
|---------|---------------|--------------------|
| `superpony` | `system-prompts/superpony.txt` | the fusion under test |
| `superpowers` | `system-prompts/superpowers.txt` | process discipline only (baseline parent) |
| `ponytail` | `system-prompts/ponytail.txt` | minimalism only (baseline parent) |

`system-prompts/*.txt` are the single source of truth. `prompt.js` reads the right one
per provider (by the provider's `label`) and wraps each task as a `[system, user]` chat.

## Layout

```
eval/
  promptfooconfig.yaml      # the eval: 3 providers x 6 tasks x 3 assertions
  prompt.js                 # builds [system, user] chat; picks variant by provider label
  assert-brevity.js         # deterministic LOC-of-code-blocks metric (smaller = better)
  system-prompts/
    superpony.txt           # = skills/superpony/SKILL.md essence
    superpowers.txt         # essence of using-superpowers + the brainstorm->finish pipeline
    ponytail.txt            # essence of the ponytail skill (the ladder + rules)
  acceptance/
    react-todo-list.md      # manual acceptance test (not promptfoo)
  README.md
  .gitignore
```

## Install

promptfoo needs no install — run it with `npx`:

```sh
npx --yes promptfoo@latest eval -c eval/promptfooconfig.yaml
```

The root `package.json` already ships the eval script + `promptfoo` devDependency, so:

```sh
npm install
npm run eval
```

## Run

Set your key first (Claude is both the model under test AND the rubric grader):

```sh
export ANTHROPIC_API_KEY=sk-ant-...
npx --yes promptfoo@latest eval -c eval/promptfooconfig.yaml
```

When only `ANTHROPIC_API_KEY` is set, promptfoo automatically uses Claude as the
grading provider for the `llm-rubric` assertions — no OpenAI key needed.

## View results

```sh
npx --yes promptfoo@latest view
```

This opens the local web UI with a variant-by-task matrix. The CLI also prints a pass/
fail table per cell after `eval`.

## Metrics (named, so they show up grouped in the UI)

| Metric | Assertion | Meaning |
|--------|-----------|---------|
| `process` | `llm-rubric` | Did it plan before coding and leave a runnable check? Skips penalty for trivial tasks. PASS >= 0.6. |
| `brevity` | `javascript` (`assert-brevity.js`) | Non-blank lines inside code fences as a net-added-LOC proxy. <=20 LOC = 1.0, >120 LOC fails. Smaller wins. |
| `minimalism` | `llm-rubric` | Did it avoid new deps, speculative abstractions, and unrequested features? Several tasks add a task-specific guard (e.g. "must use argparse"). PASS >= 0.6. |

**Reading the result:** superpony should score high on BOTH `process` and `minimalism`,
with `brevity` near ponytail and clearly above superpowers. superpowers should win
`process` but lose `brevity`/`minimalism`; ponytail should win `brevity` but lose
`process`.

## package.json

The root `package.json` already includes the eval wiring:

```json
{
  "scripts": { "eval": "promptfoo eval -c eval/promptfooconfig.yaml", "eval:view": "promptfoo view" },
  "devDependencies": { "promptfoo": "^0.121.0" }
}
```

The version is a floor, not a pin — `npm view promptfoo version` for the current release. Prefer zero deps? Skip `npm install` and use the `npx --yes promptfoo@latest ...` commands above. (ponytail: npx is the no-dependency default; the devDependency is the opt-in for repeatable CI runs.)

## Acceptance test

`acceptance/react-todo-list.md` is a separate, manual end-to-end check run inside a live
Claude Code session. It verifies the one behavior promptfoo can't: that brainstorming
**auto-triggers** before code, then a **minimal** implementation follows.
