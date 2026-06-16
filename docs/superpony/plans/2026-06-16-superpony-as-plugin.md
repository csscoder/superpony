# Superpony as a Claude Code Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert superpony from a copied `.claude/` project-files tree into a proper Claude Code **plugin** installed via a git marketplace, so it installs and updates across all projects from one source.

**Architecture:** Adopt the exact layout the parent plugins already ship (`ponytail`, `superpowers`): `.claude-plugin/{plugin.json,marketplace.json}` + repo-root `skills/ commands/ hooks/`. Hooks move from `.claude/settings.json` to `hooks/hooks.json` and resolve via `${CLAUDE_PLUGIN_ROOT}`; per-project runtime state moves to the **target** project's `.claude/` via `CLAUDE_PROJECT_DIR`. Skill-invocation directives gain the `superpony:` namespace prefix (mirroring how `superpowers` does it). Commands get short names (`/superpony:mode`, `/superpony:review`, …).

**Tech Stack:** Claude Code plugin spec, Node.js hooks (existing), JSON manifests, Markdown skills/commands.

---

## 🐴 Minimal Solution Hypothesis

The parents are the spec. `ponytail` is already a shipped plugin with the **same hook design** superpony forked (activate / mode-tracker / lib-runtime / statusline). The smallest path that fully works = **mirror ponytail's plugin layout 1:1**, rename `ponytail`→`superpony` in the new manifest/hooks plumbing, prefix cross-refs the way `superpowers` already does, and delete the old `.claude/` shell. No new design, no invention — copy two working models.

**Why not smaller?**
- *Skip the marketplace, ship only `plugin.json` + `--plugin-dir`?* — Fails the actual goal ("update everywhere"). Marketplace is the update channel. `marketplace.json` is ~12 lines (copied from ponytail). Justified.
- *Skip cross-ref prefixing, trust bare-name inside a plugin?* — The shipped `superpowers` plugin **explicitly prefixes** `superpowers:` on every invocation directive (29 occurrences). It is the authoritative same-family precedent; not following it risks silent skill-resolution failure. The prefixing is targeted (directives only), not a blind 251-line rewrite.
- *Keep `.claude/` too (hybrid)?* — User rejected. Dropped to avoid duplicated, double-maintained trees.

**Rejected approaches:**
- **Hybrid (plugin + `cp -r .claude`)** — duplication, double maintenance. Rejected by user decision.
- **Separate marketplace repo** — unnecessary; parents use `"source": "./"` in the same repo. One repo = plugin + marketplace.
- **Blind prefix of all 251 bare-name mentions** — wrong; prose/examples/test-fixtures must stay bare (matches `superpowers`).

---

## File Structure (target)

```
superpony/
├── .claude-plugin/
│   ├── plugin.json          # NEW — manifest (model: ponytail/superpowers)
│   └── marketplace.json     # NEW — single-plugin marketplace (model: ponytail)
├── skills/                  # MOVED from .claude/skills/   (20 skills, unchanged names)
├── commands/                # MOVED from .claude/commands/ (renamed short)
├── hooks/
│   ├── hooks.json           # NEW — replaces .claude/settings.json hooks block
│   ├── superpony-activate.js     # MOVED + edited (drop settings.json read)
│   ├── superpony-lib.js          # MOVED + edited (FLAG_PATH → per-project, mkdir)
│   ├── superpony-mode-tracker.js # MOVED (unchanged)
│   └── superpony-statusline.sh   # MOVED + edited (flag path → CLAUDE_PROJECT_DIR)
├── docs/ eval/ CLAUDE.md README.md package.json .gitignore   # updated, not moved
└── (.claude/ DELETED entirely)
```

**Responsibilities:** `.claude-plugin/` holds **only** manifests (hard rule — never put skills/commands/hooks inside it). `hooks/hooks.json` declares the two hooks. `skills/` and `hooks/` both sit at plugin root, so the existing `path.join(__dirname,'..','skills')` in `superpony-lib.js` keeps resolving correctly (hooks → `../skills`).

---

## Task 1: Plugin manifests

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Create the plugin manifest**

`.claude-plugin/plugin.json`:
```json
{
  "name": "superpony",
  "version": "0.1.0",
  "description": "Disciplined process (Superpowers) fused with lazy-footprint minimalism (Ponytail), as one Claude Code plugin.",
  "author": {
    "name": "Aleksandr Zidyganov"
  },
  "homepage": "https://github.com/csscoder/superpony",
  "repository": "https://github.com/csscoder/superpony",
  "license": "MIT",
  "keywords": ["skills", "superpowers", "ponytail", "process", "minimalism", "claude-code"]
}
```
> GitHub owner = `csscoder`. `name` MUST be `superpony` (becomes the `superpony:` namespace).

- [ ] **Step 2: Create the marketplace manifest**

`.claude-plugin/marketplace.json`:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "superpony",
  "description": "Disciplined process, lazy footprint. Fuses Superpowers + Ponytail into one Claude Code plugin.",
  "owner": {
    "name": "Aleksandr Zidyganov"
  },
  "plugins": [
    {
      "name": "superpony",
      "description": "Disciplined process (Superpowers) + lazy footprint (Ponytail).",
      "source": "./",
      "category": "productivity"
    }
  ]
}
```

- [ ] **Step 3: Verify JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json')); JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat(plugin): add plugin.json + marketplace.json manifests"
```

---

## Task 2: Restructure directories to plugin root

**Files:**
- Move: `.claude/skills/` → `skills/`
- Move: `.claude/commands/` → `commands/`
- Move: `.claude/hooks/` → `hooks/`

- [ ] **Step 1: git mv the three trees to repo root**

```bash
git mv .claude/skills skills
git mv .claude/commands commands
git mv .claude/hooks hooks
```

- [ ] **Step 2: Verify structure landed**

Run: `ls -d skills commands hooks && find skills -name SKILL.md | wc -l`
Expected: three dirs listed, `20`

- [ ] **Step 3: Confirm `.claude/` now holds only settings.json + runtime flag**

Run: `ls -a .claude`
Expected: `settings.json`, `.superpony-mode` (and `.DS_Store`) — handled in Task 3.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(plugin): move skills/commands/hooks to plugin root"
```

---

## Task 3: Hooks → `hooks/hooks.json`, per-project flag, drop settings.json

**Files:**
- Create: `hooks/hooks.json`
- Modify: `hooks/superpony-lib.js` (FLAG_PATH + setMode)
- Modify: `hooks/superpony-activate.js` (remove settings.json read)
- Modify: `hooks/superpony-statusline.sh` (flag path)
- Delete: `.claude/settings.json`, `.claude/.superpony-mode`, `.claude/.DS_Store`, then `.claude/`

- [ ] **Step 1: Create `hooks/hooks.json`** (model: ponytail, `${CLAUDE_PLUGIN_ROOT}` + Windows variant)

`hooks/hooks.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "command -v node >/dev/null 2>&1 && node \"${CLAUDE_PLUGIN_ROOT}/hooks/superpony-activate.js\" || exit 0",
            "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\hooks\\superpony-activate.js\" }",
            "timeout": 10,
            "statusMessage": "Loading superpony..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "command -v node >/dev/null 2>&1 && node \"${CLAUDE_PLUGIN_ROOT}/hooks/superpony-mode-tracker.js\" || exit 0",
            "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\hooks\\superpony-mode-tracker.js\" }",
            "timeout": 10,
            "statusMessage": "Tracking superpony mode..."
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Make the runtime flag per-project in `superpony-lib.js`**

Replace lines 24-27 (the `FLAG_PATH` block):
```js
// ---- runtime: per-project flag + hook output ----
// Flag lives in the TARGET project's .claude (CLAUDE_PROJECT_DIR), not the plugin
// install dir — so the mode is per-project. Git-ignored as per-session state.
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const FLAG_PATH = path.join(PROJECT_DIR, '.claude', '.superpony-mode');
```

Replace `setMode` (lines 29-31) so it creates the dir if missing (model: ponytail-runtime `mkdirSync`):
```js
function setMode(mode) {
  try {
    fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
    fs.writeFileSync(FLAG_PATH, String(mode));
  } catch (e) { /* best-effort */ }
}
```
> `SKILLS = path.join(__dirname, '..', 'skills')` (line 51) is UNCHANGED — hooks and skills both live at plugin root, so `../skills` still resolves. Verify in Step 7.

- [ ] **Step 3: Update the banner in `superpony-lib.js` buildInstructions**

In `buildInstructions` (line ~68), change the switch hint:
```js
'Switch: /superpony:mode lite|full|ultra. Off: "stop superpony" / "normal mode".';
```

- [ ] **Step 4: Drop the settings.json dependency in `superpony-activate.js`**

The plugin ships no root `settings.json`, and a plugin cannot set the user's `statusLine`. Remove the settings-read nudge block (lines 23-32) and the now-unused `fs`/`path` requires if unreferenced. Replace lines 21-39 with:
```js
let body = buildInstructions(mode);

// A plugin can't set the user's statusLine; point them at the script once.
body += '\n\nSTATUSLINE (optional): add a "statusLine" command running ' +
  '"${CLAUDE_PLUGIN_ROOT}/hooks/superpony-statusline.sh" to your settings.json to show the active mode.';

emitContext('SessionStart',
  '<EXTREMELY_IMPORTANT>\n' +
  'You have superpony: disciplined process, lazy footprint. ' +
  'Apply the policy below to EVERY task this session.\n\n' +
  body + '\n' +
  '</EXTREMELY_IMPORTANT>');
```
Then delete the unused `const fs = require('fs');` and `const path = require('path');` at the top if nothing else uses them (verify with a grep).

- [ ] **Step 5: Point the statusline script at the per-project flag**

In `hooks/superpony-statusline.sh`, replace the flag resolution (line 4):
```bash
flag="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/.superpony-mode"
```

- [ ] **Step 6: Delete the old `.claude/` shell**

```bash
git rm .claude/settings.json
rm -f .claude/.superpony-mode .claude/.DS_Store
rmdir .claude 2>/dev/null || true
```
> `.superpony-mode` is git-ignored (already in `.gitignore`), so `rm` not `git rm`.

- [ ] **Step 7: Verify hook scripts parse and resolve paths**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json')); console.log('hooks.json ok')"
node -c hooks/superpony-lib.js && node -c hooks/superpony-activate.js && node -c hooks/superpony-mode-tracker.js && echo "js syntax ok"
CLAUDE_PROJECT_DIR=/tmp/sp-test node -e "const l=require('./hooks/superpony-lib'); l.setMode('lite'); console.log(require('fs').readFileSync('/tmp/sp-test/.claude/.superpony-mode','utf8'))"
```
Expected: `hooks.json ok`, `js syntax ok`, `lite` (flag written under the simulated project dir).

- [ ] **Step 8: Commit**

```bash
git add hooks/ ; git rm -r --cached .claude 2>/dev/null || true
git commit -m "feat(plugin): hooks.json + CLAUDE_PLUGIN_ROOT; per-project flag; drop settings.json"
```

---

## Task 4: Rename commands to short namespaced names

**Files (rename all under `commands/`):**

| from | to | invocation |
|---|---|---|
| `superpony.md` | `mode.md` | `/superpony:mode` |
| `superpony-spec.md` | `spec.md` | `/superpony:spec` |
| `superpony-plan.md` | `plan.md` | `/superpony:plan` |
| `superpony-build.md` | `build.md` | `/superpony:build` |
| `superpony-review.md` | `review.md` | `/superpony:review` |
| `superpony-audit.md` | `audit.md` | `/superpony:audit` |
| `superpony-debt.md` | `debt.md` | `/superpony:debt` |
| `superpony-check.md` | `check.md` | `/superpony:check` |
| `superpony-help.md` | `help.md` | `/superpony:help` |

- [ ] **Step 1: Rename the nine command files**

```bash
cd commands
git mv superpony.md mode.md
git mv superpony-spec.md spec.md
git mv superpony-plan.md plan.md
git mv superpony-build.md build.md
git mv superpony-review.md review.md
git mv superpony-audit.md audit.md
git mv superpony-debt.md debt.md
git mv superpony-check.md check.md
git mv superpony-help.md help.md
cd ..
```

- [ ] **Step 2: Find every in-content reference to the old command names**

Run: `grep -rnoE '/superpony(-[a-z]+)?\b' commands/ skills/`
Expected: a list. Each `/superpony-X` → `/superpony:X`; bare `/superpony` (the activator) → `/superpony:mode`.

- [ ] **Step 3: Rewrite those references**

For each hit from Step 2, edit the file: `/superpony-review` → `/superpony:review`, …, `/superpony` (activator) → `/superpony:mode`. (e.g. `commands/help.md` lists all commands; update its table.)

- [ ] **Step 4: Verify no stale `/superpony-` slash forms remain**

Run: `grep -rnoE '/superpony-[a-z]+' commands/ skills/ README.md CLAUDE.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add commands/ skills/
git commit -m "refactor(plugin): short namespaced command names (/superpony:mode, :review, ...)"
```

---

## Task 5: Prefix `superpony:` on skill-invocation directives

**Scope:** Only **directives that invoke a skill** get the prefix — matching how shipped `superpowers` does it. Prose mentions, code examples, file names, and the `ponytail:` *comment marker* (used by the `ponytail-debt` skill — it is a grep token, NOT a skill ref) stay bare.

**Files:** `skills/**/SKILL.md` and `skills/**/*.md`, `commands/*.md`.

**Skill names to consider:** brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, ponytail, ponytail-audit, ponytail-debt, ponytail-help, ponytail-review, receiving-code-review, requesting-code-review, subagent-driven-development, superpony, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills.

- [ ] **Step 1: Find invocation-directive patterns (the things to prefix)**

Run:
```bash
grep -rniE 'REQUIRED (SUB-)?SKILL|REQUIRED BACKGROUND|Use (the )?[a-z][a-z-]+( skill)?|use [a-z][a-z-]+ instead|invoke [a-z-]+|\*\*(executing-plans|writing-plans|brainstorming|ponytail-review|ponytail-audit|ponytail-debt|requesting-code-review|receiving-code-review|test-driven-development|systematic-debugging|using-superpowers|verification-before-completion|subagent-driven-development|dispatching-parallel-agents|using-git-worktrees|finishing-a-development-branch|writing-skills)\*\*' skills/ commands/
```
Expected: the directive list to edit (compare against `superpowers` which has 29 such sites across 14 skills; superpony has more skills, expect ~30-60).

- [ ] **Step 2: Apply the prefix to each directive**

For every directive hit, prefix the skill name: `Use the test-driven-development skill` → `Use the superpony:test-driven-development skill`; `**REQUIRED SUB-SKILL:** Use executing-plans` → `Use superpony:executing-plans`; related-skill bullet `**writing-plans** — ...` → `**superpony:writing-plans** — ...`.

- [ ] **Step 3: Explicitly DO NOT prefix the comment marker**

Run: `grep -rn 'ponytail:' skills/ponytail/SKILL.md skills/ponytail-debt/SKILL.md`
Confirm every hit is a *comment-convention* token (`// ponytail: ...`, `grep ... 'ponytail:'`), NOT a skill invocation. Leave all of them bare. (The `ponytail` skill itself, when *invoked*, is `superpony:ponytail`.)

- [ ] **Step 4: Update the injected banner + root policy skill references**

In `skills/superpony/SKILL.md`, prefix any directive that tells the agent to invoke a phase skill (`writing-plans`, `executing-plans`, `brainstorming`, `ponytail-review`, …) with `superpony:`. The hook injects this file live, so the prefix propagates to the session banner.

- [ ] **Step 5: Verify directives are prefixed, prose is not over-prefixed**

Run: `grep -rnoE 'superpony:[a-z-]+' skills/ commands/ | wc -l` (should be > 0, roughly matching Step 1 count)
Run: `grep -rniE 'Use the (executing-plans|writing-plans|test-driven-development|systematic-debugging) skill' skills/ commands/` (should be empty — all such directives now prefixed)

- [ ] **Step 6: Commit**

```bash
git add skills/ commands/
git commit -m "refactor(plugin): prefix superpony: on skill-invocation directives"
```

---

## Task 6: Update documentation, spec, memory, eval

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/superpony/specs/2026-06-16-superpony-claude-code-design.md`
- Modify: `eval/README.md`, `eval/acceptance/react-todo-list.md`
- Modify: `package.json` (version sync)
- Modify: memory `claude-code-skill-activation.md` + `MEMORY.md`

- [ ] **Step 1: README — replace the install section**

Rewrite the "project files, not a plugin / `cp -r .claude`" block (around lines 27-41, 88). New install:
````markdown
## Установка

Superpony — **плагин Claude Code**, ставится через marketplace:

```
/plugin marketplace add https://github.com/csscoder/superpony
/plugin install superpony@superpony
```

Обновление везде, где установлен: `/plugin update superpony`.

Хук `SessionStart` активирует политику со следующей сессии. Скилы и команды
вызываются с namespace: `superpony:writing-plans`, `/superpony:review`.
Каноничная политика: [`skills/superpony/SKILL.md`](skills/superpony/SKILL.md).

Локальная разработка плагина: `claude --plugin-dir /path/to/superpony`.
````
Update the repo-tree diagram (line ~88): `.claude/` block → `skills/ commands/ hooks/ .claude-plugin/` at root.

- [ ] **Step 2: CLAUDE.md — invert the stale rules**

- "shipped as Claude Code **project files** … NOT a plugin: no `plugin.json`, no marketplace (by design)." → "shipped as a **Claude Code plugin**: `.claude-plugin/plugin.json` + `marketplace.json`, install via `/plugin install`."
- "Install elsewhere: `cp -r .claude /path/to/project/`." → "Install elsewhere: `/plugin marketplace add <repo>` then `/plugin install superpony@superpony`."
- Source of truth: "`.claude/skills/` is the single source of truth" → "`skills/` is the single source of truth."
- Cross-references rule: "Cross-references are **bare-name** … Never add `superpowers:` / `superpony:` prefixes." → "Skill-invocation directives use the `superpony:` prefix (matches shipped `superpowers`); bare-name only in prose/examples. The `ponytail:` comment marker is NOT a skill ref — never prefix it."
- Hooks: "$CLAUDE_PROJECT_DIR (in settings.json) and __dirname" → "`${CLAUDE_PLUGIN_ROOT}` (in `hooks/hooks.json`) and `__dirname`; per-project flag resolves via `CLAUDE_PROJECT_DIR`."
- `.claude/.superpony-mode` runtime-state note → "`<project>/.claude/.superpony-mode`, written by the hook into the target project, git-ignored."

- [ ] **Step 3: Design spec — record the reversal**

In `docs/superpony/specs/2026-06-16-superpony-claude-code-design.md`, append a dated decision-reversal note under section 1 and at line ~120:
```markdown
> **Update 2026-06-16 (superseded):** Decision #1 reversed. Superpony now ships as a
> Claude Code plugin (`.claude-plugin/plugin.json` + `marketplace.json`) to enable
> one-source install/update across projects. Skill-invocation directives are now
> `superpony:`-prefixed; bare-name remains only in prose. See
> `docs/superpony/plans/2026-06-16-superpony-as-plugin.md`.
```
Do NOT rewrite the historical spec body — it documents the original decision; the note supersedes it.

- [ ] **Step 4: eval — fix path references**

In `eval/README.md:26` and `eval/acceptance/react-todo-list.md:36`, change `.claude/skills` → `skills`.

- [ ] **Step 5: package.json — keep version in sync**

Confirm `package.json` `version` matches `plugin.json` (`0.1.0`). Update description to "...as a Claude Code plugin." Drop `"private": true` only if publishing to npm is intended (it is not — leave it).

- [ ] **Step 6: Update memory**

Edit `~/.claude/projects/.../memory/claude-code-skill-activation.md`: add that inside a plugin, skill-invocation directives need the `plugin:skill` prefix to resolve reliably (shipped `superpowers` precedent), while bare-name is for plain project/personal skills only. Update its `MEMORY.md` one-liner if the hook changes.

- [ ] **Step 7: Verify docs have no stale claims**

Run: `grep -rniE 'cp -r \.claude|not a plugin|no plugin\.json|bare-name|project files, not a plugin' README.md CLAUDE.md`
Expected: no output (or only the superseded historical spec note).

- [ ] **Step 8: Commit**

```bash
git add README.md CLAUDE.md docs/ eval/ package.json
git commit -m "docs(plugin): rewrite install for marketplace; invert bare-name rule; record spec reversal"
```

---

## Task 7: Verify the plugin loads and works

**No unit-test harness here — verification = loading the plugin and observing behavior.**

- [ ] **Step 1: Load locally via dev flag**

Run: `claude --plugin-dir /Users/csscoder/Development/LOCAL_PRJ_AI/02_HermesWorks/superpony`
(In a throwaway project dir, not inside the superpony repo, to test as a real consumer.)

- [ ] **Step 2: Confirm namespaced skills + commands appear**

In that session, check the skill/command list (`/help` or skill listing).
Expected: skills show as `superpony:writing-plans`, `superpony:ponytail-review`, …; commands as `/superpony:mode`, `/superpony:review`, ….

- [ ] **Step 3: Confirm SessionStart injection fires**

Expected: the `<EXTREMELY_IMPORTANT>` superpony policy banner is injected at session start, showing `SUPERPONY ACTIVE — intensity: FULL` and the `/superpony:mode` switch hint.

- [ ] **Step 4: Confirm per-project mode flag**

Run `/superpony:mode lite`, then in the consumer project: `cat .claude/.superpony-mode`
Expected: `lite` written under the **consumer project's** `.claude/`, not the plugin install dir.

- [ ] **Step 5: Confirm intra-plugin cross-ref resolves**

Trigger `superpony:writing-plans` and confirm its `superpony:executing-plans` / `superpony:subagent-driven-development` directives resolve to the bundled skills (no "skill not found").
> If bare-name ALSO resolves inside the plugin, that's a bonus — the prefix is still correct and safe. If the prefix is the only thing that resolves, Task 5 was required (as predicted by the `superpowers` precedent).

- [ ] **Step 6: Confirm statusline (optional wiring)**

If you add the `statusLine` command from the activate.js hint to the consumer's `settings.json`, expect `[SUPERPONY]`/mode to render. If a plugin cannot drive statusLine in your Claude Code version, the README documents it as a manual step — acceptable.

- [ ] **Step 7: Final commit / tag**

```bash
git add -A && git commit -m "chore(plugin): superpony v0.1.0 as Claude Code plugin" || echo "nothing to commit"
git tag v0.1.0-plugin
```

---

## Self-Review

**1. Spec coverage:**
- Manifests (plugin + marketplace) → Task 1 ✓
- Root-level skills/commands/hooks layout → Task 2 ✓
- Hooks via `${CLAUDE_PLUGIN_ROOT}`, per-project flag → Task 3 ✓
- Short namespaced commands → Task 4 ✓
- `superpony:` cross-ref prefixing (the main risk) → Task 5 ✓
- Docs/spec/memory/eval reversal → Task 6 ✓
- Load + behavior verification → Task 7 ✓
- "Update everywhere" goal → marketplace (Task 1) + `/plugin update` (Task 6 README) ✓

**2. Placeholder scan:** `<owner>` is a real publish-time substitution (flagged inline), not a code placeholder. All code/JSON blocks are complete.

**3. Type/name consistency:** `FLAG_PATH`, `PROJECT_DIR`, `setMode` consistent across Task 3 steps. Command short-names in Task 4 table match Task 6 README invocations and Task 7 checks. `superpony:` prefix form consistent in Tasks 4/5/6/7.

**Open verification points (not blockers):** (a) whether bare-name resolves intra-plugin — Task 5 Step 5 settles it empirically, prefix is safe either way; (b) whether a plugin can drive statusLine — Task 7 Step 6, falls back to documented manual wiring.
