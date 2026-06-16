#!/usr/bin/env node
// superpony — UserPromptSubmit hook.
// Detects `/superpony [lite|full|ultra|off]` and "stop superpony" / "normal mode",
// updates the per-project flag, and re-injects the active policy on a change.
// Plain `/superpony-review` etc. are slash commands routed to their skills; only
// the bare `/superpony` toggles intensity.

const {
  getDefaultMode, normalizeMode, setMode, clearMode, emitContext, buildInstructions,
} = require('./superpony-lib');

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  try {
    // String.trim() also strips a leading UTF-8 BOM (U+FEFF) some shells prepend.
    const data = JSON.parse(input.trim());
    const lower = (data.prompt || '').trim().toLowerCase();

    // Deactivate — anchored at START so a question like "how do I stop superpony?"
    // does NOT trigger an accidental mid-session deactivation.
    if (/^(stop superpony|normal mode)\b/.test(lower)) {
      clearMode();
      emitContext('UserPromptSubmit', 'SUPERPONY OFF — plain behavior until /superpony.');
      return;
    }

    // `/superpony` optionally followed by a level. Lookahead (?=\s|$) excludes
    // `/superpony-review` and friends (hyphen is not whitespace).
    const m = lower.match(/^[/@$]superpony(?=\s|$)(?:\s+(\w+))?/);
    if (m) {
      const arg = m[1] || '';
      if (arg === 'off') {
        clearMode();
        emitContext('UserPromptSubmit', 'SUPERPONY OFF.');
        return;
      }
      const mode = normalizeMode(arg) || getDefaultMode();
      setMode(mode);
      emitContext('UserPromptSubmit', buildInstructions(mode));
    }
  } catch (e) { /* silent — never block the prompt */ }
});
