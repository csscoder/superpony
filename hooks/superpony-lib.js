#!/usr/bin/env node
// superpony — shared hook library: intensity config, per-project flag I/O,
// Claude Code hook output, and the SessionStart injection builder.
// (config + runtime + instructions merged into one file — fewest files possible.)

const fs = require('fs');
const path = require('path');

// ---- config: intensity modes ----
// Default mode resolution: SUPERPONY_DEFAULT_MODE env var (if valid) → 'full'.
const DEFAULT_MODE = 'full';
const RUNTIME_MODES = ['off', 'lite', 'full', 'ultra'];

function normalizeMode(mode) {
  if (typeof mode !== 'string') return null;
  const m = mode.trim().toLowerCase();
  return RUNTIME_MODES.includes(m) ? m : null;
}

function getDefaultMode() {
  return normalizeMode(process.env.SUPERPONY_DEFAULT_MODE) || DEFAULT_MODE;
}

// ---- runtime: per-project flag + hook output ----
// Flag lives in the TARGET project's .claude (CLAUDE_PROJECT_DIR), not the plugin
// install dir — so the mode is per-project. Git-ignored as per-session state.
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const FLAG_PATH = path.join(PROJECT_DIR, '.claude', '.superpony-mode');

function setMode(mode) {
  try {
    fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
    fs.writeFileSync(FLAG_PATH, String(mode));
  } catch (e) { /* best-effort */ }
}

function readMode() {
  try { return fs.readFileSync(FLAG_PATH, 'utf8').trim(); } catch (e) { return null; }
}

function clearMode() {
  try { fs.unlinkSync(FLAG_PATH); } catch (e) { /* already gone */ }
}

// Claude Code consumes hookSpecificOutput.additionalContext (nested form).
function emitContext(event, context) {
  if (!context) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: context },
  }));
}

// ---- instructions: SessionStart injection (root policy + skill bootstrap) ----
// Read live from the skill files so the injection never drifts from the skills.
const SKILLS = path.join(__dirname, '..', 'skills');
const ROOT_SKILL = path.join(SKILLS, 'superpony', 'SKILL.md');
const BOOTSTRAP_SKILL = path.join(SKILLS, 'using-superpowers', 'SKILL.md');

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

function stripFrontmatter(s) {
  return String(s || '').replace(/^---[\s\S]*?---\s*/, '');
}

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

module.exports = {
  DEFAULT_MODE, RUNTIME_MODES, normalizeMode, getDefaultMode,
  FLAG_PATH, setMode, readMode, clearMode, emitContext,
  buildInstructions,
};
