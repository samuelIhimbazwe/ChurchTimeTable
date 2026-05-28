#!/usr/bin/env node
/**
 * Church glossary enforcement for Kinyarwanda ARB values.
 */
const fs = require('fs');
const path = require('path');
const { loadAllArbs, repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const glossaryPath = path.join(__dirname, 'glossary', 'forbidden_rw.json');

function main() {
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
  const arbs = loadAllArbs(path.join(root, 'mobile', 'lib', 'l10n'));
  const rw = arbs.rw;
  const errors = [];

  for (const rule of glossary.patterns || []) {
    const re = new RegExp(rule.regex, rule.flags || '');
    const except = new Set(rule.except_keys || []);

    for (const [key, value] of rw.entries) {
      if (except.has(key)) continue;
      if (re.test(value)) {
        errors.push(
          `❌ Glossary violation [${rule.id}]:\n` +
            `   Key: ${key}\n` +
            `   Value: "${value}"\n` +
            `   ${rule.message}`,
        );
      }
    }
  }

  for (const [key, requiredSubstrings] of Object.entries(glossary.required_values || {})) {
    const value = rw.entries.get(key);
    if (value === undefined) {
      errors.push(`❌ Required glossary key missing in rw ARB: ${key}`);
      continue;
    }
    for (const required of requiredSubstrings) {
      if (!value.includes(required)) {
        errors.push(
          `❌ Glossary required term missing:\n` +
            `   Key: ${key}\n` +
            `   Expected to contain: "${required}"\n` +
            `   Actual: "${value}"`,
        );
      }
    }
  }

  if (errors.length) {
    console.error(`\nGlossary enforcement failed (${errors.length} issue(s)):\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log('✅ Kinyarwanda glossary enforcement OK');
}

main();
