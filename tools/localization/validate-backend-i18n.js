#!/usr/bin/env node
/**
 * Backend i18n parity — rw.ts, en.ts, fr.ts must share keys; placeholders must match.
 */
const fs = require('fs');
const path = require('path');
const { extractPlaceholders, LOCALES, repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const messagesDir = path.join(root, 'backend', 'src', 'i18n', 'messages');

function parseTsMessageFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = new Map();
  const re = /^\s*([A-Z][A-Z0-9_]*)\s*:\s*(['"`])([\s\S]*?)\2\s*,?\s*$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1];
    let value = m[3];
    value = value.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    entries.set(key, value);
  }
  return entries;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function main() {
  const localeFiles = { rw: 'rw.ts', en: 'en.ts', fr: 'fr.ts' };
  const byLocale = {};
  for (const [loc, file] of Object.entries(localeFiles)) {
    const p = path.join(messagesDir, file);
    if (!fs.existsSync(p)) {
      console.error(`❌ Backend message file missing: ${p}`);
      process.exit(1);
    }
    byLocale[loc] = parseTsMessageFile(p);
  }

  const allKeys = new Set();
  for (const loc of LOCALES) {
    for (const k of byLocale[loc].keys()) allKeys.add(k);
  }

  const errors = [];

  for (const key of [...allKeys].sort()) {
    for (const loc of LOCALES) {
      if (!byLocale[loc].has(key)) {
        errors.push(
          `❌ Missing backend translation:\n   Key: ${key}\n   Missing locale: ${loc}`,
        );
      }
    }
  }

  const notificationKeys = [...allKeys].filter((k) => k.startsWith('NOTIFICATION_'));
  for (const key of notificationKeys) {
    const refPh = extractPlaceholders(byLocale.rw.get(key) || '');
    for (const loc of ['en', 'fr']) {
      const ph = extractPlaceholders(byLocale[loc].get(key) || '');
      if (!setsEqual(refPh, ph)) {
        errors.push(
          `❌ Backend notification placeholder mismatch:\n` +
            `   Key: ${key}\n` +
            `   rw: {${[...refPh].join('}, {')}}\n` +
            `   ${loc}: {${[...ph].join('}, {')}}`,
        );
      }
    }
  }

  // Ensure notification bodies use placeholders where rw does
  for (const key of notificationKeys) {
    if (!key.endsWith('_BODY')) continue;
    const rwVal = byLocale.rw.get(key) || '';
    if (rwVal.includes('{') && !rwVal.match(/\{[a-zA-Z_]+\}/)) {
      errors.push(`❌ Invalid placeholder syntax in ${key} (rw)`);
    }
  }

  if (errors.length) {
    console.error(`\nBackend i18n validation failed (${errors.length} issue(s)):\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log(`✅ Backend i18n parity OK (${allKeys.size} keys)`);
}

main();
