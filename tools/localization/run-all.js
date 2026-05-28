#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const scripts = [
  'validate-arb.js',
  'validate-placeholders.js',
  'validate-glossary.js',
  'validate-backend-i18n.js',
  'validate-enum-mapping.js',
  'validate-tone-metadata.js',
  'validate-offline.js',
  'scan-flutter-strings.js',
];

const dir = __dirname;
let failed = false;

console.log('CMMS Localization QA Pipeline\n' + '='.repeat(32) + '\n');

for (const script of scripts) {
  const name = script.replace('.js', '');
  process.stdout.write(`→ ${name}... `);
  const r = spawnSync(process.execPath, [path.join(dir, script)], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    failed = true;
    console.log('FAIL\n');
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
  } else {
    const line = (r.stdout || '').trim().split('\n').pop();
    console.log(line || 'OK');
  }
}

console.log('\n' + '='.repeat(32));
if (failed) {
  console.error('\n❌ Localization QA pipeline FAILED\n');
  process.exit(1);
}
console.log('\n✅ Localization QA pipeline passed\n');
