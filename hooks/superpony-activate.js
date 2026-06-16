#!/usr/bin/env node
// superpony — SessionStart hook.
// Resolve mode (persisted session flag wins, else default); "off" → clear &
// stay silent (plain Claude); otherwise write the flag and inject policy + bootstrap.

const {
  getDefaultMode, setMode, clearMode, readMode, emitContext, buildInstructions,
} = require('./superpony-lib');

const mode = readMode() || getDefaultMode();

if (mode === 'off') {
  clearMode();
  process.exit(0);
}

setMode(mode);

const body = buildInstructions(mode);

emitContext('SessionStart',
  '<EXTREMELY_IMPORTANT>\n' +
  'You have superpony: disciplined process, lazy footprint. ' +
  'Apply the policy below to EVERY task this session.\n\n' +
  body + '\n' +
  '</EXTREMELY_IMPORTANT>');
