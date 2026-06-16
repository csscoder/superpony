#!/usr/bin/env node
// superpony — SessionStart hook.
// Resolve mode (persisted session flag wins, else default); "off" → clear &
// stay silent (plain Claude); otherwise write the flag and inject policy + bootstrap.

const fs = require('fs');
const path = require('path');
const {
  getDefaultMode, setMode, clearMode, readMode, emitContext, buildInstructions,
} = require('./superpony-lib');

const mode = readMode() || getDefaultMode();

if (mode === 'off') {
  clearMode();
  process.exit(0);
}

setMode(mode);

let body = buildInstructions(mode);

// Nudge to wire the statusline if this project's settings lack one.
try {
  const settings = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'),
  );
  if (!settings.statusLine) {
    body += '\n\nSTATUSLINE SETUP: add a "statusLine" command running ' +
      '.claude/hooks/superpony-statusline.sh to show the active mode.';
  }
} catch (e) { /* no settings / unreadable — skip the nudge */ }

emitContext('SessionStart',
  '<EXTREMELY_IMPORTANT>\n' +
  'You have superpony: disciplined process, lazy footprint. ' +
  'Apply the policy below to EVERY task this session.\n\n' +
  body + '\n' +
  '</EXTREMELY_IMPORTANT>');
