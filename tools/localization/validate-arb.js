#!/usr/bin/env node
/**
 * Missing translation detector — all keys must exist in rw, en, fr ARB files.
 */
const path = require('path');
const { loadAllArbs, LOCALES, repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const l10nDir = path.join(root, 'mobile', 'lib', 'l10n');

function main() {
  const arbs = loadAllArbs(l10nDir);
  const allKeys = new Set();
  for (const loc of LOCALES) {
    for (const key of arbs[loc].entries.keys()) {
      allKeys.add(key);
    }
  }

  const errors = [];
  for (const key of [...allKeys].sort()) {
    for (const loc of LOCALES) {
      if (!arbs[loc].entries.has(key)) {
        errors.push({
          type: 'missing_translation',
          key,
          locale: loc,
          message: `❌ Missing translation:\n   Key: ${key}\n   Missing locale: ${loc}`,
        });
      }
    }
  }

  // Empty values
  for (const loc of LOCALES) {
    for (const [key, value] of arbs[loc].entries) {
      if (!value.trim()) {
        errors.push({
          type: 'empty_value',
          key,
          locale: loc,
          message: `❌ Empty translation value for key "${key}" in ${loc}`,
        });
      }
    }
  }

  if (errors.length) {
    console.error(`\nARB validation failed (${errors.length} issue(s)):\n`);
    for (const e of errors) {
      console.error(e.message);
      console.error('');
    }
    process.exit(1);
  }

  console.log(`✅ ARB key parity OK (${allKeys.size} keys × ${LOCALES.length} locales)`);
}

main();
