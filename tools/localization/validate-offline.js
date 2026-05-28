#!/usr/bin/env node
/**
 * Ensures localization is bundled offline — no runtime translation APIs.
 */
const fs = require('fs');
const path = require('path');
const { repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const mobileDir = path.join(root, 'mobile');

const FORBIDDEN = [
  /googleapis\.com\/language\/translate/i,
  /translation\.googleapis/i,
  /microsofttranslator/i,
  /deepl\.com/i,
  /cloud\.google\.com\/translate/i,
  /package:translator\//,
  /easy_localization.*assetLoader:\s*NetworkAssetLoader/i,
  /http.*\.arb/i,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'build' || ent.name === '.dart_tool' || ent.name === 'node_modules')
      continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(dart|yaml|json)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function main() {
  const errors = [];
  const pubspec = fs.readFileSync(path.join(mobileDir, 'pubspec.yaml'), 'utf8');
  if (/translator:|google_translate|flutter_translate:/i.test(pubspec)) {
    errors.push('❌ pubspec.yaml lists a cloud translation dependency');
  }

  for (const file of walk(mobileDir)) {
    const content = fs.readFileSync(file, 'utf8');
    for (const re of FORBIDDEN) {
      if (re.test(content)) {
        errors.push(
          `❌ Possible runtime translation API:\n   File: ${path.relative(root, file)}\n   Pattern: ${re}`,
        );
      }
    }
  }

  const l10nDir = path.join(mobileDir, 'lib', 'l10n');
  for (const loc of ['rw', 'en', 'fr']) {
    if (!fs.existsSync(path.join(l10nDir, `app_${loc}.arb`))) {
      errors.push(`❌ Missing bundled ARB: app_${loc}.arb`);
    }
  }

  if (errors.length) {
    console.error(`\nOffline localization validation failed:\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log('✅ Offline-only localization (bundled ARB, no cloud APIs)');
}

main();
