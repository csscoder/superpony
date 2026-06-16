// Builds a chat prompt for one variant: [system = that variant's policy file, user = the task].
// One file serves all three variants — the variant is read from the calling provider's
// label (set in promptfooconfig.yaml). System prompts stay single-source in
// system-prompts/<variant>.txt; we don't duplicate them into JSON.
// ponytail: synchronous fs read, no caching — eval runs are short; add a cache if file count grows.
const fs = require('fs');
const path = require('path');

const VARIANTS = new Set(['superpony', 'superpowers', 'ponytail']);

module.exports = function ({ vars, provider }) {
  // provider.label is the variant name (see providers[].label in promptfooconfig.yaml).
  const label = provider && provider.label;
  if (!VARIANTS.has(label)) {
    throw new Error(`prompt.js: unknown provider label "${label}"; expected one of ${[...VARIANTS].join(', ')}`);
  }
  const system = fs.readFileSync(path.join(__dirname, 'system-prompts', `${label}.txt`), 'utf8');
  return [
    { role: 'system', content: system },
    { role: 'user', content: vars.task },
  ];
};
