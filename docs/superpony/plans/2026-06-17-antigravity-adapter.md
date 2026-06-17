# Antigravity adapter for superpony — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpony:subagent-driven-development (recommended) or superpony:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make superpony installable in the Antigravity CLI (`agy`) so the skill suite is discoverable and the root policy applies to every task — using agy-native mechanisms only.

**Architecture:** Two independently-installed parts. **Part A** = a root `plugin.json` (`"skills":["./skills"]`); install with `agy plugin install <repo-url-or-dir>` — the agy-native path (exactly how the sibling `ponytail` installs into agy; agy has **no** `plugin marketplace add` command, so no `marketplace.json` is shipped). This discovers the existing `skills/` tree (zero copies). **Part B** = three `@generated` always-on rule files (`antigravity/rules/superpony{,-lite,-ultra}.md`) carrying the canonical policy + bootstrap; the user `@import`s one in `~/.gemini/GEMINI.md` (global) or copies one into `<workspace>/.agents/rules/` (per-project). A small `superpony-lib.js` refactor lets one generator script (`scripts/sync-antigravity-rule.js`) build all three from the single source of truth.

**Tech Stack:** Node.js (stdlib `fs`/`path` only — no new deps), Markdown rule files with YAML frontmatter, npm scripts, `agy v1.0.8` (`agy plugin validate` as the oracle).

**Source spec:** `docs/superpony/specs/2026-06-16-antigravity-adapter-design.md` (v3, two review rounds applied).

> **Plan-time correction (supersedes spec §4/§5.1/§6/§11.1):** the spec proposed shipping `.agents/plugins/marketplace.json` and installing via `agy plugin install superpony@superpony`. Verified against the `agy 1.0.8` binary (`agy plugin --help` has no `marketplace` subcommand) and against ponytail's own README (its agy install is a direct git URL), this is wrong. This plan installs via `agy plugin install <url|dir>` and ships **no** marketplace.json. The spec should be patched to match (offered separately).

---

## 🐴 Minimal Solution Hypothesis

The shortest path that fully works: **one ~6-line refactor** of `buildInstructions` (add an optional `banner` arg) + **one generator script** that loops three modes and writes three rule files + **one tiny manifest** (root `plugin.json`) + **npm wiring** + **one README section**. No new dependency, no test framework, no copies of `skills/`, no hook port, no commands shipped to agy, no marketplace.json.

### Why not smaller?

- **Why a generator, not 3 hand-written rule files?** Hand-writing duplicates the canonical policy → violates the repo rule "policy lives only in `skills/superpony/SKILL.md`" and drifts on every SKILL edit. The generator is the DRY enforcement; `--check` is the drift gate. Justified.
- **Why three rule files, not one?** Spec §2 puts all three intensities in-scope, and agy has no global manual-rules folder (round-2 finding) so intensity = which file is active. The generator emits all three from one loop — marginal cost ≈ 0. Justified.
- **Why the lib refactor, not string surgery in the script?** Round-2 review flagged banner string-surgery as brittle (Medium). The refactor is ~6 lines and keeps the Claude hook byte-identical in behavior. Justified.
- **Why no `marketplace.json`?** agy has no `plugin marketplace add` command; its native install is `agy plugin install <git-url|dir>` (ponytail's agy row does exactly this). A marketplace file would be unused weight — explicitly cut (Ponytail YAGNI).
- **Why no test framework?** The repo has zero JS unit tests today. The generator's own `--check` mode + `agy plugin validate .` + small `node -e` assertions are the verification — adding jest/mocha for one refactor is over-engineering (Ponytail). Justified.

### Rejected approaches

- **Ship `.agents/plugins/marketplace.json` + `agy plugin install superpony@superpony`** (spec §5.1) — agy has no `plugin marketplace add` command to register a custom marketplace; the binary's native path is `agy plugin install <git-url|dir>` (verified; matches ponytail's agy README row). The marketplace file is unused for agy.
- **Port the Node hooks** — agy exposes no context-injecting hook surface; a planted `hooks.json` loads but never fires. Rules are the native replacement.
- **Base rule + `@`-mention overlays** (spec v2) — agy has no global manual-rules folder; overlays would be invisible unless copied per workspace.
- **Ship `commands/` to agy** — bare-filename collisions (`/help`) and renaming shared files corrupts Claude's `/superpony:*`. Deferred (spec §12).
- **Thin `AGENTS.md`-only** (ponytail's instruction-tier row) — skips agy's native skill suite, which superpony specifically wants.
- **Introduce a JS test runner** — YAGNI for a one-function refactor; existing verification gates suffice.

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `hooks/superpony-lib.js` | Modify (~6 lines) | `buildInstructions(mode, {banner})` accepts a host banner; extract `defaultBanner`. Claude hook behavior unchanged. |
| `scripts/sync-antigravity-rule.js` | Create | Generate the three `antigravity/rules/*.md` from canonical policy; `--check` mode = drift gate. Stdlib only. |
| `antigravity/rules/superpony.md` | Create (@generated) | Full policy, `trigger: always_on`. |
| `antigravity/rules/superpony-lite.md` | Create (@generated) | Lite policy, `trigger: always_on`. |
| `antigravity/rules/superpony-ultra.md` | Create (@generated) | Ultra policy, `trigger: always_on`. |
| `plugin.json` | Create | agy plugin manifest at repo root: `"skills":["./skills"]`. Coexists with `.claude-plugin/plugin.json` (each CLI reads only its own). |
| `package.json` | Modify | Add `sync:agy`, `check:agy`, `test` scripts. |
| `README.md` | Modify | Add `## Antigravity (agy)` install + intensity + limitations section. |

**Note on @generated files:** the plan shows the *generator* in full. The three rule files are derived output (built live from `skills/superpony/SKILL.md` + `skills/using-superpowers/SKILL.md`), so they are verified *structurally* (frontmatter present, `--check` passes, non-empty) rather than by inlining their text — inlining would duplicate the canonical policy the generator exists to avoid duplicating.

---

### Task 1: Refactor `buildInstructions` to accept a host banner

**Files:**
- Modify: `hooks/superpony-lib.js:67-83`

- [ ] **Step 1: Run the assertion from the repo root — verify it FAILS (red)**

First `cd "$(git rev-parse --show-toplevel)"`, then run this single line (the inline assertion **is** the test — no temp file, portable on any machine; the relative `./hooks/...` resolves because cwd is the repo root):

```bash
node -e "const {buildInstructions}=require('./hooks/superpony-lib.js');const a=require('assert');const c=buildInstructions('full',{banner:'AGY_BANNER_X'});a.ok(c.startsWith('AGY_BANNER_X'),'host banner not applied');const d=buildInstructions('full');a.ok(d.startsWith('SUPERPONY ACTIVE — intensity: FULL.'),'default banner broken');a.ok(d.includes('/superpony:mode'),'default banner lost the command hint');a.ok(c.includes('SUPERPONY ROOT POLICY')&&c.includes('SKILL BOOTSTRAP'),'sections missing');console.log('OK');"
```

Expected: FAIL — `AssertionError [ERR_ASSERTION]: host banner not applied` (the current `buildInstructions` ignores a second arg).

- [ ] **Step 2: Implement the refactor**

Replace the current `function buildInstructions(mode) { ... }` block (lines 67-83) with:

```js
function defaultBanner(level) {
  return 'SUPERPONY ACTIVE — intensity: ' + level.toUpperCase() + '. ' +
    'Disciplined process (Superpowers) + lazy footprint (Ponytail). ' +
    'Switch: /superpony:mode lite|full|ultra. Off: "stop superpony" / "normal mode".';
}

function buildInstructions(mode, opts = {}) {
  const level = normalizeMode(mode) || DEFAULT_MODE;
  const banner = opts.banner || defaultBanner(level);

  return [
    banner,
    '',
    '===== SUPERPONY ROOT POLICY (how much to build + how to work) =====',
    stripFrontmatter(readFile(ROOT_SKILL)),
    '',
    '===== SKILL BOOTSTRAP (using-superpowers — how to find & use skills) =====',
    stripFrontmatter(readFile(BOOTSTRAP_SKILL)),
  ].join('\n');
}
```

(Export list is unchanged — `buildInstructions` is already exported; `defaultBanner` stays internal.)

- [ ] **Step 3: Re-run the same assertion — verify it PASSES (green)**

Run the exact same one-liner from Step 1 (from the repo root).
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add hooks/superpony-lib.js
git commit -m "refactor(hooks): buildInstructions accepts an optional host banner"
```

---

### Task 2: Generator script + the three always-on rule files

**Files:**
- Create: `scripts/sync-antigravity-rule.js`
- Create (via the script): `antigravity/rules/superpony.md`, `antigravity/rules/superpony-lite.md`, `antigravity/rules/superpony-ultra.md`

- [ ] **Step 1: Write the generator script**

Create `scripts/sync-antigravity-rule.js`:

```js
#!/usr/bin/env node
// Generates the agy always-on policy rules from the canonical superpony policy.
//   node scripts/sync-antigravity-rule.js          -> (re)write antigravity/rules/*.md
//   node scripts/sync-antigravity-rule.js --check   -> exit 1 if any file drifts (CI gate)
// Canonical policy stays ONLY in skills/superpony/SKILL.md; this is derived output.

const fs = require('fs');
const path = require('path');
const { buildInstructions } = require('../hooks/superpony-lib.js');

const RULES_DIR = path.join(__dirname, '..', 'antigravity', 'rules');

// intensity -> output filename
const MODES = {
  full: 'superpony.md',
  lite: 'superpony-lite.md',
  ultra: 'superpony-ultra.md',
};

function agyBanner(level) {
  return 'SUPERPONY ACTIVE — intensity: ' + level.toUpperCase() + '. ' +
    'Disciplined process (Superpowers) + lazy footprint (Ponytail). ' +
    'This policy applies to EVERY task in this Antigravity (agy) session.';
}

function frontmatter(level) {
  return [
    '---',
    'name: superpony-' + level,
    'description: Superpony policy (' + level +
      ') — disciplined process, lazy footprint; applies to every task.',
    'trigger: always_on',
    '---',
  ].join('\n');
}

function render(level) {
  const body = buildInstructions(level, { banner: agyBanner(level) });
  const content =
    frontmatter(level) + '\n' +
    '<!-- @generated by scripts/sync-antigravity-rule.js — do not edit; ' +
    'edit skills/superpony/SKILL.md and re-run `npm run sync:agy` -->\n\n' +
    body + '\n';
  // acceptance: every rule begins with valid frontmatter carrying trigger: always_on
  if (!content.startsWith('---\n') || !content.includes('\ntrigger: always_on\n')) {
    throw new Error('generated ' + level + ' rule is missing trigger frontmatter');
  }
  return content;
}

function main() {
  const check = process.argv.includes('--check');
  if (!check) fs.mkdirSync(RULES_DIR, { recursive: true });

  let drift = false;
  for (const [level, file] of Object.entries(MODES)) {
    const target = path.join(RULES_DIR, file);
    const next = render(level);
    if (check) {
      let current = null;
      try { current = fs.readFileSync(target, 'utf8'); } catch (e) { /* missing */ }
      if (current !== next) {
        drift = true;
        console.error('DRIFT: antigravity/rules/' + file +
          (current === null ? ' (missing)' : ' (out of date)'));
      }
    } else {
      fs.writeFileSync(target, next);
      console.log('wrote antigravity/rules/' + file);
    }
  }

  if (check) {
    if (drift) {
      console.error('Run `npm run sync:agy` to regenerate.');
      process.exit(1);
    }
    console.log('antigravity rules up to date.');
  }
}

main();
```

- [ ] **Step 2: Run `--check` to verify it fails (files not generated yet)**

Run: `node scripts/sync-antigravity-rule.js --check`
Expected: FAIL (exit 1) — three `DRIFT: ... (missing)` lines for `superpony.md`, `superpony-lite.md`, `superpony-ultra.md`.

- [ ] **Step 3: Generate the rule files**

Run: `node scripts/sync-antigravity-rule.js`
Expected: three `wrote antigravity/rules/<file>` lines.

- [ ] **Step 4: Verify `--check` now passes and frontmatter is correct**

Run:
```bash
node scripts/sync-antigravity-rule.js --check
head -5 antigravity/rules/superpony.md
```
Expected: `antigravity rules up to date.` (exit 0); the head shows
```
---
name: superpony-full
description: Superpony policy (full) — ...
trigger: always_on
---
```
Spot-check that the body contains the policy and bootstrap:
```bash
grep -l "SUPERPONY ROOT POLICY" antigravity/rules/*.md && grep -l "SKILL BOOTSTRAP" antigravity/rules/*.md
```
Expected: all three files listed for both greps.

- [ ] **Step 5: Commit (script + generated rules together)**

```bash
git add scripts/sync-antigravity-rule.js antigravity/rules/
git commit -m "feat(agy): generate always-on policy rules (full/lite/ultra) from canonical SKILL.md"
```

---

### Task 3: Root agy plugin manifest

**Files:**
- Create: `plugin.json` (repo root)

- [ ] **Step 1: Create `plugin.json`**

```json
{
  "name": "superpony",
  "version": "0.1.0",
  "description": "Disciplined process (Superpowers) + lazy footprint (Ponytail), as an Antigravity plugin.",
  "skills": ["./skills"]
}
```

- [ ] **Step 2: Verify it is valid JSON and does not shadow the Claude manifest**

Run:
```bash
node -e "console.log(require('./plugin.json').skills)"
node -e "console.log(require('./.claude-plugin/plugin.json').name)"
```
Expected: `[ './skills' ]` then `superpony` — both manifests parse; neither references the other.

- [ ] **Step 3: Commit**

```bash
git add plugin.json
git commit -m "feat(agy): add root plugin.json manifest (skills-only)"
```

---

### Task 4: Wire npm scripts (sync + drift gate)

**Files:**
- Modify: `package.json:8-11`

- [ ] **Step 1: Add the scripts**

Replace the `"scripts"` block:

```json
  "scripts": {
    "eval": "promptfoo eval -c eval/promptfooconfig.yaml",
    "eval:view": "promptfoo view"
  },
```

with:

```json
  "scripts": {
    "sync:agy": "node scripts/sync-antigravity-rule.js",
    "check:agy": "node scripts/sync-antigravity-rule.js --check",
    "test": "npm run check:agy",
    "eval": "promptfoo eval -c eval/promptfooconfig.yaml",
    "eval:view": "promptfoo view"
  },
```

- [ ] **Step 2: Run the test entry (drift gate) to verify it passes**

Run: `npm test`
Expected: runs `check:agy` → `antigravity rules up to date.` exit 0.

- [ ] **Step 3: Negative check — drift is actually caught**

Run:
```bash
printf '\n<!-- drift -->\n' >> antigravity/rules/superpony.md
npm test; echo "exit=$?"
git checkout -- antigravity/rules/superpony.md
```
Expected: a `DRIFT: antigravity/rules/superpony.md (out of date)` line and `exit=1`; then the file is restored.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build(agy): add sync:agy / check:agy npm scripts and wire check into test"
```

---

### Task 5: Validate against the agy oracle

**Files:** none (verification only).

- [ ] **Step 1: Confirm agy is available**

Run: `agy --version`
Expected: `1.0.8` (or newer).

- [ ] **Step 2: Validate the plugin manifest + skills**

Run: `agy plugin validate .`
Expected: reports the `skills` component processed with **zero errors** (the ground-truth oracle for §13). Extra dirs (`antigravity/`, `.claude-plugin/`) are ignored.

- [ ] **Step 3: If validate reports errors, fix and re-run**

If `agy plugin validate .` rejects a field in root `plugin.json`, trim to the minimal accepted set (`name`, `skills`) and re-run until clean. Record any deviation from the spec in a short note at the bottom of the spec's §11. (No commit unless a fix was applied; then `git commit -m "fix(agy): adjust plugin.json to satisfy agy plugin validate"`.)

---

### Task 6: Document install + intensity + limitations in README

**Files:**
- Modify: `README.md` (insert a section before `## Modes and commands`)

- [ ] **Step 1: Insert the Antigravity section**

Insert the content **immediately before** the line `## Modes and commands` in `README.md`. The block below is wrapped in a **four-backtick** fence so its inner three-backtick code fences are literal — copy everything **between** the four-backtick lines (not the four-backtick lines themselves) into the README:

````markdown
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
- Pipeline commands (`/superpony:spec|check|plan|build|review`) stay Claude-only; the skills carry the substance.
````

> Implementer note: the `@config/...` import path is the one open item from spec §11.2 — confirm it resolves during the smoke test (Task 7) and correct the path here if agy resolves `@import` from a different base.

- [ ] **Step 2: Verify the section renders and the install command is the URL form**

Run: `grep -n "## Antigravity (agy)" README.md && grep -n "agy plugin install https://github.com/csscoder/superpony" README.md`
Expected: both found; the new section sits before `## Modes and commands`. Confirm there is **no** occurrence of `superpony@superpony` or `plugin marketplace`:
```bash
grep -qE "superpony@superpony|plugin marketplace" README.md || echo "clean"
```
Expected: `clean` (grep finds no matches → exits non-zero → `echo` runs). Portable in non-interactive shells (no `!` history-expansion edge case).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(agy): document agy install, @import intensity, and limitations"
```

> `README.ru.md` is intentionally **not** updated in v1 (Ponytail: minimal; translation can follow on request). Note this in the PR description.

---

### Task 7: Manual smoke test (documented; run once)

**Files:** none (manual verification; do not commit state).

This exercises the one remaining open question (spec §11.2: the exact `@import` base path), and confirms the URL/dir install end to end.

- [ ] **Step 1: Install the plugin into agy (from the local checkout)**

Run (absolute path avoids cwd ambiguity):
```bash
agy plugin install "$(git rev-parse --show-toplevel)"
agy plugin list
ls ~/.gemini/config/plugins/superpony/antigravity/rules/
```
Expected: install succeeds; `agy plugin list` shows a `superpony` entry with a `skills` component; the three rule files are present at the install path. (End users install from the URL instead — `agy plugin install https://github.com/csscoder/superpony` — which requires the repo to be pushed/public; the local-dir form needs no push.)

- [ ] **Step 2: Wire the global import (create the dir if absent)**

Run:
```bash
mkdir -p ~/.gemini
printf '%s\n' '@config/plugins/superpony/antigravity/rules/superpony.md' >> ~/.gemini/GEMINI.md
```

- [ ] **Step 3: Confirm policy + skill in a fresh session**

Run:
```bash
agy -p "What operating policy are you under right now, and name one superpony skill you can invoke." </dev/null
```
Expected: the reply reflects the SUPERPONY banner/policy (proves the `@import` resolved) and names a superpony skill (proves the plugin's skills are discoverable). If the policy is absent, the `@import` path base is wrong — fix the path in README (Task 6) + spec §11.2 and retry.

- [ ] **Step 4: Confirm intensity swap**

Edit the `~/.gemini/GEMINI.md` line to end in `...superpony-ultra.md`, re-run Step 3's prompt.
Expected: banner reads `intensity: ULTRA`.

- [ ] **Step 5: Clean up**

Remove the `@import` line from `~/.gemini/GEMINI.md` (or leave it if you want superpony active) and, if desired, `agy plugin uninstall superpony`.

---

## Self-Review

**1. Spec coverage:**
- §2 in-scope plugin packaging → Task 3 (root plugin.json) + Task 5/7 (install/validate). ✅
- §2 root policy as rules at three intensities → Tasks 1, 2. ✅
- §2 `full` default, lite/ultra alternates → generator `MODES` map + README intensity swap (Tasks 2, 6). ✅
- §2 install docs + sync check → Tasks 6, 4. ✅
- §5.4 frontmatter `trigger: always_on` + banner without `/superpony:mode` → generator `frontmatter()`/`agyBanner()` (Task 2). ✅
- §5.4 refactor `superpony-lib.js` (banner arg) → Task 1. ✅
- §5.4 mkdir recursive → `fs.mkdirSync(RULES_DIR,{recursive:true})` (Task 2). ✅
- §8 validation oracle → Task 5; sync `--check` wired to `test` → Task 4; frontmatter sanity assert → `render()` throw (Task 2); manual smoke → Task 7. ✅
- §11.2 open question (@import path) → exercised in Task 7 with fix-and-record instructions. ✅
- **Superseded:** spec §4/§5.1/§6/§11.1 marketplace.json + `superpony@superpony` install → corrected to `agy plugin install <url|dir>`, no marketplace.json (see the Plan-time correction note + Rejected approaches). ✅
- §13 acceptance criteria → Tasks 5 (validate), 7 (install/import/intensity), 2 (frontmatter), 4 (check passes), 1 (refactor), 6 (README). ✅

**2. Placeholder scan:** No `TBD`/`TODO`/"handle edge cases"/"similar to Task N". All code blocks are complete. The three rule files are @generated (verified structurally, not inlined) — documented rationale in File Structure. README content uses a real 4-backtick fence (no escaped backticks). ✅

**3. Type consistency:** `buildInstructions(mode, opts={})`/`opts.banner` consistent across Task 1 (def) and Task 2 (call). Filenames `superpony{,-lite,-ultra}.md` consistent across `MODES`, README, smoke test. `sync:agy`/`check:agy` script names consistent across package.json and README/commits. ✅

**Known residual (not a gap):** the `@import` base path is confirmed live in Task 7 with explicit fix-and-record steps — matching the spec's deliberate deferral of that one item to build. The marketplace.json/install-command item is now resolved (no longer deferred).
