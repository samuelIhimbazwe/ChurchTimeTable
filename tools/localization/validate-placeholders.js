#!/usr/bin/env node
/**
 * Placeholder validation — {name} placeholders must match across rw, en, fr per key.
 */
const path = require('path');
const { loadAllArbs, LOCALES, extractPlaceholders, repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const l10nDir = path.join(root, 'mobile', 'lib', 'l10n');

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

function main() {
  const arbs = loadAllArbs(l10nDir);
  const referenceLocale = 'rw';
  const allKeys = new Set();
  for (const loc of LOCALES) {
    for (const key of arbs[loc].entries.keys()) allKeys.add(key);
  }

  const errors = [];
  for (const key of [...allKeys].sort()) {
    const ref = arbs[referenceLocale].entries.get(key);
    if (ref === undefined) continue;

    const refPlaceholders = extractPlaceholders(ref);
    for (const loc of LOCALES) {
      if (loc === referenceLocale) continue;
      const value = arbs[loc].entries.get(key);
      if (value === undefined) continue;

      const locPlaceholders = extractPlaceholders(value);
      if (!setsEqual(refPlaceholders, locPlaceholders)) {
        errors.push({
          key,
          locale: loc,
          expected: [...refPlaceholders],
          actual: [...locPlaceholders],
          message:
            `❌ Placeholder mismatch:\n` +
            `   Key: ${key}\n` +
            `   Reference (${referenceLocale}): {${[...refPlaceholders].join('}, {')}}\n` +
            `   ${loc}: {${[...locPlaceholders].join('}, {')}}\n` +
            `   rw: "${ref}"\n` +
            `   ${loc}: "${value}"`,
        });
      }
    }

    // Orphan placeholders in metadata @key entries
    const meta = arbs[referenceLocale].meta.get(key);
    if (meta?.placeholders) {
      const metaNames = new Set(Object.keys(meta.placeholders));
      for (const p of refPlaceholders) {
        if (!metaNames.has(p)) {
          errors.push({
            key,
            message: `⚠️  Placeholder {${p}} used in "${key}" but missing from @${key} metadata`,
          });
        }
      }
    }
  }

  if (errors.length) {
    console.error(`\nPlaceholder validation failed (${errors.length} issue(s)):\n`);
    for (const e of errors) {
      console.error(e.message);
      console.error('');
    }
    process.exit(1);
  }

  console.log('✅ Placeholder parity OK across all locales');
}

main();
