# Antigravity adapter for superpony — design spec

- **Date:** 2026-06-16
- **Status:** Draft v4 — two spec reviews + a plan-review correction applied; awaiting approval
- **Pipeline:** spec (this) → `/superpony:check` → `/superpony:plan` → `/superpony:check` → `/superpony:build` → `/superpony:review`
- **Author:** Aleksandr Zidyganov (with Claude)

## 0. Review status (cross-vendor gate)

Two external review rounds via `agy` (Gemini 3.5 Flash High). All findings verified against the `agy 1.0.8` binary and applied.

**Round 1 (v1 → v2): APPROVE_WITH_FIXES** — `.agent/`→`.agents/` (verified plural); commands not shipped to agy (skills-only) to avoid `/help` collisions without corrupting Claude `/superpony:*`; intensity made rule-based not ephemeral; sync script mkdir-recursive; dropped the direct-`@import`-SKILL.md trap; `sync --check` wired into `package.json`.

**Round 2 (v2 → v3): REVISE** — both High findings verified true against the binary:

| # | Sev | Finding | Resolution (verified) |
|---|-----|---------|-----------|
| 1 | High | No global manual-rules folder in agy 1.0.8 → `@`-mention overlay rules in the plugin dir are invisible globally | **Verified** (binary distinguishes `global_rules` = `~/.gemini/GEMINI.md` file vs `workspace_rules` = `.agents/rules/`). Redesigned: **three self-contained rule files** (lite/full/ultra); user selects one via `@import` in `GEMINI.md` (global) or copy into `<workspace>/.agents/rules/` (§5.5). |
| 2 | High | `.agents/rules/` files need YAML frontmatter with a `trigger` field | **Verified** (binary strings: `"trigger"`, `always_on`, `manual`, `glob`/`globs`). Rule files now carry frontmatter (`name`, `description`, `trigger: always_on`) instead of being frontmatter-stripped (§5.4). |
| 3 | Med | `superpony-lib.js` hardcodes the banner / doesn't export helpers → fragile string surgery | Accepted: refactor `buildInstructions(mode, {banner})` to accept a host banner (and/or export the read/strip helpers); sync script uses it (§5.4). |
| 4 | Med | §11 open questions are architectural blockers | Accepted: rule-loading facts resolved into §3/§5; only the exact `@import` path remains deferred (§11). |

**Plan-time correction (2026-06-17, during `/superpony:check` on the implementation plan):** the install mechanism was found wrong against the `agy 1.0.8` binary — there is **no `agy plugin marketplace add`** command, so `marketplace.json` + `agy plugin install superpony@superpony` cannot work. Corrected throughout (§3/§4/§5.1/§6/§11): install is `agy plugin install <git-url|dir>`, no `marketplace.json`. Verified against the binary and ponytail's agy install row.

**Build-time finding (2026-06-17, during `/superpony:build`, surfaced by `agy plugin validate`):** agy auto-discovers `commands/` at the plugin root regardless of the manifest and converts all 9 to bare-named skills; `"commands": []` does not suppress it. The original §2/§5.3 premise "omit from manifest → excluded" was false. Accepted as documented behavior — the commands are inert in agy and the always-on rule carries the policy (see §2/§5.3).

## 1. Problem & goal

Superpony ships as a Claude Code plugin (`.claude-plugin/`, `skills/`, `commands/`, Node `hooks/`). We want the same disciplined-process / lazy-footprint behavior inside the **Antigravity CLI (`agy`)** — the same CLI superpony already shells out to.

Goal: make superpony installable in `agy` so (a) the **skill suite** is discoverable, and (b) the root policy applies to **every task** (not just on demand), mirroring the Claude SessionStart hook — using Antigravity-native mechanisms only.

Precedent: `ponytail` is a multi-harness port; its Antigravity row is instruction-tier (`AGENTS.md`). Superpony does more because `agy` natively supports **skills** and a **plugin** system.

## 2. Scope

**In (v1):**
- `agy` plugin packaging so `skills/` is discovered (reused as-is, no copies).
- Root policy as Antigravity **rules** (the hook's job, done natively) at three intensities.
- `full` is the default; `lite`/`ultra` are self-contained alternates.
- Install docs + a sync check keeping generated rules in step with the canonical policy.

**Out (v1):**
- **Relying on the shared `commands/` in agy.** They are Claude-side pipeline orchestration: `mode` is hook-backed; `build`/`check` are cross-vendor calls that collapse inside agy-as-Gemini. **Caveat (build-verified):** agy auto-discovers `commands/` at the plugin root regardless of the manifest (`"commands": []` does not suppress it) and converts all 9 to skills by **bare filename** (`help, build, check, plan, review, spec, mode, audit, debt`); `agy plugin validate` is still `[ok]`. We accept this — the converted skills are inert/redundant in agy (the always-on rule carries the substance), and there is no manifest-level opt-out short of restructuring the shared repo (rejected — §10). (Future: a separate `superpony-*`-prefixed agy command set — §12.)
- Porting the Node **hooks**. `agy` exposes **no user-configurable context-injecting hook surface** (§3); a planted `hooks.json` loads but never fires (silent). Revisit if Google ships it.
- Statusline badge for `agy`.

## 3. Research basis & confidence

Tools: Context7 (official `agy` CLI + Google Antigravity docs), Perplexity (ecosystem, low confidence), the installed **`agy v1.0.8`** binary (ground truth: `agy plugin validate`, real install/uninstall, `strings`), the `dPeluChe/trs` hooks investigation, and two `agy` cross-vendor review rounds.

**(a) Local-codebase facts:**
- Canonical policy lives **only** in `skills/superpony/SKILL.md` (repo CLAUDE.md forbids duplication).
- `hooks/superpony-lib.js` `buildInstructions(mode)` builds `banner(mode) + skills/superpony/SKILL.md + skills/using-superpowers/SKILL.md` (read live, frontmatter-stripped). It currently **hardcodes a Claude banner** and exports only `buildInstructions` + mode helpers (not `readFile`/`stripFrontmatter`/paths).

**(b) Verified against `agy v1.0.8` (ground truth):**
- Plugin = `plugin.json` + components `{skills, agents, commands, mcpServers, hooks}`. **No `rules` component** — rules install separately.
- `plugin.json` auto-discovers `skills/` relative to the manifest dir; explicit `"skills":["./skills"]` also works. **`commands/` is likewise auto-discovered at the plugin root regardless of the manifest** (build-verified: `"commands": []` does not suppress it); each is "converted to a skill" by **bare filename**, so the 9 superpony commands surface as bare skills in agy (accepted as inert — §5.3).
- Plugins install to **`~/.gemini/config/plugins/<name>/`**, preserving the source tree.
- **Install mechanism (verified):** `agy plugin install <git-url|dir>`. `agy plugin --help` (1.0.8) lists `list/import/install/uninstall/enable/disable/validate/link/help` — **no `marketplace` subcommand**; the sibling `ponytail` installs into agy via a direct git URL. So **no `marketplace.json`** is shipped (this corrects the original v1–v3 design).
- Workspace dir is **`.agents/`** (plural): binary string `{workspace}/.agents/skills/{skill_name}/SKILL.md`. Context7 docs saying `.agent/` are stale.
- **Rule scopes (verified):** binary distinguishes `global_rules` (the single file `~/.gemini/GEMINI.md`) from `workspace_rules` (the dir `<workspace>/.agents/rules/`). There is **no global manual-rules folder**; manual/`@`-toggle rules live only in a workspace's `.agents/rules/`.
- **Rule activation = a `trigger` frontmatter field (verified):** binary strings `"trigger"`, `always_on`, `manual`, `glob`/`globs` (and a Model-Decision mode via natural-language description). A `.agents/rules/*.md` file needs this frontmatter to load.
- Skill format = identical `SKILL.md` (`name`+`description` frontmatter); global skills at `~/.gemini/antigravity/skills/`.
- `agy` print-mode (review tooling only): non-TTY stdout drop is **fixed in 1.0.8** (plain `agy -p … </dev/null >file` is clean; `script` PTY corrupts output — the global `agy-*` skills were updated accordingly).

**(b′) Via the trs investigation (agy v1.0.1, corroborated by 1.0.2–1.0.6 changelogs):**
- No user-configurable lifecycle hook that injects context; `hooks.json` registers subagents (silent no-op for injection). Reliable injection = rules: `~/.gemini/GEMINI.md` honors an `@import` line at session start (confirmed for IDE and `agy`).

**(c) Deferred to build (§11):**
- The exact `@import` path: confirm `~/.gemini/GEMINI.md` resolves `@config/plugins/superpony/antigravity/rules/superpony.md` (relative to `~/.gemini/`).

## 4. Architecture

Two independently-installed parts — rules are **not** a plugin component:

```
superpony repo
├── plugin.json                          # NEW — agy manifest at repo root; "skills":["./skills"]
├── skills/                              # REUSED as-is
├── antigravity/rules/superpony.md       # NEW — @generated, full (default), trigger: always_on
├── antigravity/rules/superpony-lite.md  # NEW — @generated, lite,  trigger: always_on
├── antigravity/rules/superpony-ultra.md # NEW — @generated, ultra, trigger: always_on
├── scripts/sync-antigravity-rule.js     # NEW — generates + --check verifies all three (DRY)
└── .claude-plugin/, commands/, hooks/   # UNCHANGED — Claude path; root plugin.json ignored by Claude

Part A — Plugin (skills):  agy plugin install <repo-url|dir>  →  superpony skill suite discoverable
Part B — Rule (policy):    @import ONE file in ~/.gemini/GEMINI.md (global) OR copy ONE into <workspace>/.agents/rules/
```

## 5. Components

### 5.1 Plugin manifest (`plugin.json`)
- Root `plugin.json`: name/version/description + **`"skills":["./skills"]`** (commands omitted). Coexists with `.claude-plugin/plugin.json` (each CLI reads only its own).
- **Install:** `agy plugin install <repo-url|dir>` (e.g. `agy plugin install https://github.com/csscoder/superpony`, or a local checkout). **No `marketplace.json`** — `agy 1.0.8` has no `plugin marketplace add` command (binary-verified); its native install takes a git URL or directory, exactly as the sibling `ponytail` does for agy.

### 5.2 Skills (reuse, zero copies)
The whole `skills/` tree is discovered as-is — single source of truth, no duplication. Includes the root `superpony` skill and `using-superpowers`.

### 5.3 Commands — Claude-primary; agy auto-exposes them (v1)
Shared `commands/` is authored for Claude's `/superpony:*` pipeline. We do **not** rely on them in agy, but **agy auto-converts `commands/` to bare-named skills** on install (build-verified — the manifest cannot opt out; `"commands": []` is ignored). They are harmless/redundant in agy (the always-on rule carries the policy; `build`/`check` would merely re-invoke agy). Excluding them would require restructuring the shared repo (rejected — §10). Future: a prefixed agy command set to make them coherent rather than inert (§12).

### 5.4 Always-on policy rules (the hook replacement)
- **What:** three `@generated` files under `antigravity/rules/` — `superpony.md` (full), `superpony-lite.md`, `superpony-ultra.md`. Each is self-contained: **YAML frontmatter** (`name`, `description`, `trigger: always_on`) + an agy-flavored, intensity-stating banner + `skills/superpony/SKILL.md` (root policy) + `skills/using-superpowers/SKILL.md` (bootstrap). The banner does **not** reference the Claude-only `/superpony:mode` command. This is the payload that makes the policy apply to **every** task.
  - The frontmatter is required for workspace `.agents/rules/` loading (verified `trigger` field). When `@import`ed into `GEMINI.md` it is harmless (treated as text).
- **DRY:** generated by `scripts/sync-antigravity-rule.js`, which calls `buildInstructions(mode, {banner})` for each of the three modes — reusing the canonical policy + bootstrap from `hooks/superpony-lib.js`. To enable this cleanly, **refactor `superpony-lib.js`** so `buildInstructions` accepts an optional host `banner` (and/or export `readFile`/`stripFrontmatter`/`ROOT_SKILL`/`BOOTSTRAP_SKILL`) — avoiding fragile string surgery on a hardcoded banner. Canonical policy stays only in `skills/superpony/SKILL.md`.
- The script **creates `antigravity/rules/` recursively** before writing, and `--check` exits non-zero if any committed file drifts from a fresh generation.

### 5.5 Intensity (lite / full / ultra)
Intensity = **which single rule file is active** (agy has no global manual-rules folder, so there is no global `@`-toggle):
- **Global default:** install doc adds one line to `~/.gemini/GEMINI.md`: `@config/plugins/superpony/antigravity/rules/superpony.md` (full). To change globally, swap that line to the `-lite`/`-ultra` file.
- **Per-project override:** copy the desired file into `<project>/.agents/rules/superpony.md`; its `trigger: always_on` frontmatter auto-activates it in that workspace.
- Exactly one file should be active at a time (all three are `always_on`); the install doc states this. Documented limitation vs Claude: no per-prompt ephemeral switch (no hook).

## 6. Install / data flow
1. `agy plugin install <repo-url|dir>` (e.g. `agy plugin install https://github.com/csscoder/superpony`) → skills available.
2. Add one `@import` line to `~/.gemini/GEMINI.md` (default → full) → policy injected every session.
3. Session start: `agy` loads `GEMINI.md` (+ any `<workspace>/.agents/rules/`) → root policy present → discipline applies to every task; skills invoked on demand. Switch intensity by swapping the import or dropping a file into the workspace.

## 7. Failure modes & error handling
- **Silent-hook trap (designed out):** no `hooks.json` for injection (loads-but-never-fires). Injection is rules-only — confirmed working.
- **Wrong rules path / missing trigger (designed out):** `.agents/` plural + `trigger: always_on` frontmatter, both binary-verified; either omission = the rule silently fails to load.
- **Two intensities active at once:** install doc mandates exactly one active file; `--check` does not police user installs but `agy` shows loaded rules at session start for verification.
- **Drift:** `sync-antigravity-rule.js --check` fails CI if any generated rule diverges from canonical policy.
- **Manifest errors:** `agy plugin validate .` is the gate — `skills` processed, zero errors.

## 8. Testing (minimal, ponytail-style)
- **Validation:** `agy plugin validate .` reports `skills` processed (the oracle), as a CI step.
- **Sync:** `sync-antigravity-rule.js --check` asserts the three generated rules equal fresh generations. Wired into `package.json` (`"sync:agy"`, `"check:agy"`) and run from the test entry.
- **Frontmatter sanity:** each generated rule starts with valid YAML frontmatter containing `trigger: always_on` (assert in the sync check).
- **Smoke (manual, documented):** install into `agy`, `@import` the full rule, start a session, confirm the policy banner appears and a superpony skill is invocable; uninstall.
- No new frameworks/fixtures (YAGNI).

## 9. Repo conventions honored
- Canonical policy only in `skills/superpony/SKILL.md`; rules are `@generated`.
- Adapter stays thin (new files: 1 manifest, 1 marketplace, 3 generated rules, 1 sync script, docs; 1 small `superpony-lib.js` refactor).
- UTF-8; English committed files/commits.
- MIT attribution (both parents) already in README; add the Antigravity install section.

## 10. Alternatives considered
- **Full hook parity:** rejected — no context-injecting hook surface (§3 b′); silent failure; duplicates native always-on rules.
- **Base rule + `@`-mention overlays (v2):** rejected — agy has no global manual-rules folder; overlays would be invisible unless copied per workspace.
- **Ship commands as prefixed agy skills (round-1 reviewer's rename):** deferred (§12) — renaming shared `commands/` corrupts the Claude side.
- **Thin `AGENTS.md`-only (ponytail's row):** too little — skips the native skill suite.
- **Chosen — skills plugin + three self-contained always-on rules:** the realistic ceiling on current `agy`; smallest design delivering every-task policy, the full skill suite, and global intensity selection.

## 11. Open questions / verify during build
1. Confirm `~/.gemini/GEMINI.md` `@import` resolves `@config/plugins/superpony/antigravity/rules/superpony.md` (relative to `~/.gemini/`); adjust install doc if the resolution base differs.

## 12. Out of scope / future
- A separate `superpony-*`-prefixed agy command set (workflows) if pipeline commands are wanted in agy without collisions.
- Hook-based live injection + per-project mode persistence — when/if Google ships a user hook surface (tracked: Antigravity CLI repo, AI dev forum).
- Statusline badge; non-CLI Antigravity IDE specifics beyond GEMINI.md/`.agents/rules`.

## 13. Acceptance criteria
- `agy plugin validate .` → `skills` processed, no errors.
- `agy plugin install` makes superpony skills invocable in an `agy` session.
- Each generated rule begins with YAML frontmatter (`trigger: always_on`); with one `@import`ed in `GEMINI.md` the root policy + bootstrap are present at session start; banner is intensity-correct.
- Switching the `@import` (or dropping a file into `<workspace>/.agents/rules/`) changes intensity.
- `sync-antigravity-rule.js --check` passes, wired into `package.json`; canonical policy not duplicated; `antigravity/rules/` created recursively.
- `superpony-lib.js` refactor lets the sync script set the host banner without string surgery.
- README documents: `agy plugin install`, the one-line `@import` (and how to swap intensity), per-workspace override, and the limitations (no ephemeral toggle; commands Claude-only in v1).
