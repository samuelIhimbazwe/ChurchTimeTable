#!/usr/bin/env node
/**
 * Validates tone metadata coverage for localization keys.
 */
const fs = require('fs');
const path = require('path');
const { loadAllArbs, repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const tonePath = path.join(__dirname, 'glossary', 'tone-metadata.json');

const VALID_TONES = new Set([
  'pastoral',
  'administrative',
  'operational',
  'disciplinary',
  'celebratory',
]);

function resolveTone(key, config) {
  let matched = config.default_tone;
  let longest = 0;
  for (const [prefix, tone] of Object.entries(config.prefix_tones || {})) {
    if (key.startsWith(prefix) && prefix.length > longest) {
      longest = prefix.length;
      matched = tone;
    }
  }
  return matched;
}

function main() {
  const config = JSON.parse(fs.readFileSync(tonePath, 'utf8'));
  const arbs = loadAllArbs(path.join(root, 'mobile', 'lib', 'l10n'));
  const keys = [...arbs.rw.entries.keys()];
  const errors = [];
  const toneReport = {};

  for (const key of keys) {
    const tone = resolveTone(key, config);
    if (!VALID_TONES.has(tone)) {
      errors.push(`❌ Invalid tone "${tone}" for key ${key}`);
    }
    toneReport[tone] = (toneReport[tone] || 0) + 1;

    for (const [prefix, required] of Object.entries(config.required_tones_by_prefix || {})) {
      if (key.startsWith(prefix) && tone !== required) {
        errors.push(
          `❌ Tone mismatch for ${key}: expected "${required}", got "${tone}"`,
        );
      }
    }
  }

  if (errors.length) {
    console.error(`\nTone metadata validation failed:\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log('✅ Tone metadata coverage OK');
  console.log(`   Distribution: ${JSON.stringify(toneReport)}`);
}

main();
