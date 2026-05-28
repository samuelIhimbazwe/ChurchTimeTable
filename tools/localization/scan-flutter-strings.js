#!/usr/bin/env node
/**
 * Detects likely hardcoded user-facing strings in Flutter lib/.
 */
const fs = require('fs');
const path = require('path');
const { repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const libDir = path.join(root, 'mobile', 'lib');

const ALLOWED_PATTERNS = [
  /^$/,
  /^[0-9.,\s%+#]+$/,
  /^\/[a-z0-9\-_/]+$/i,
  /^[A-Z_]{2,}$/, // enum-like constants in UI edge cases
  /^\s*$/,
];

const WIDGET_PATTERNS = [
  /\bText\s*\(\s*'([^'\\]|\\.)*'/g,
  /\bText\s*\(\s*"([^"\\]|\\.)*"/g,
  /\bSnackBar\s*\([^)]*content:\s*Text\s*\(\s*'([^'\\]|\\.)*'/g,
  /\bSnackBar\s*\([^)]*content:\s*Text\s*\(\s*"([^"\\]|\\.)*"/g,
  /\bAppBar\s*\([^)]*title:\s*(?:const\s+)?Text\s*\(\s*'([^'\\]|\\.)*'/g,
  /\bInputDecoration\s*\([^)]*labelText:\s*'([^'\\]|\\.)*'/g,
  /\bInputDecoration\s*\([^)]*labelText:\s*"([^"\\]|\\.)*"/g,
  /\bTooltip\s*\(\s*'([^'\\]|\\.)*'/g,
];

const IGNORE_FILES = [
  'app_localizations.dart',
  'firebase_options.dart',
];

const IGNORE_LINE_SUBSTRINGS = [
  'l10n.',
  'context.l10n',
  'AppLocalizations',
  'import ',
  '// l10n-ignore',
  'debugPrint',
  'TextStyle',
  'Key(',
  'package:',
];

function shouldIgnoreString(s) {
  if (s.length < 2) return true;
  if (ALLOWED_PATTERNS.some((re) => re.test(s))) return true;
  if (s.startsWith('http')) return true;
  if (s.includes('l10n.')) return true;
  return false;
}

function walkDartFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'generated' || ent.name === 'l10n') continue;
      walkDartFiles(p, out);
    } else if (ent.name.endsWith('.dart') && !IGNORE_FILES.includes(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];
  const rel = path.relative(root, filePath).replace(/\\/g, '/');

  lines.forEach((line, idx) => {
    if (IGNORE_LINE_SUBSTRINGS.some((s) => line.includes(s))) return;

    for (const re of WIDGET_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const raw = m[1] ?? m[0];
        const strMatch = line.match(/'([^']*)'|"([^"]*)"/);
        const literal = strMatch ? (strMatch[1] ?? strMatch[2]) : raw;
        if (shouldIgnoreString(literal)) continue;
        if (/[a-zA-Z]{3,}/.test(literal)) {
          findings.push({
            file: rel,
            line: idx + 1,
            text: literal,
            snippet: line.trim().slice(0, 120),
          });
        }
      }
    }
  });

  return findings;
}

function main() {
  const files = walkDartFiles(libDir);
  const all = [];
  for (const f of files) {
    all.push(...scanFile(f));
  }

  if (all.length) {
    console.error(`\n❌ Hardcoded string scan failed (${all.length} suspect(s)):\n`);
    for (const f of all) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`   Found: "${f.text}"`);
      console.error(`   Use: context.l10n.<semantic_key>`);
      console.error(`   Code: ${f.snippet}`);
      console.error('');
    }
    console.error(
      'Tip: Add // l10n-ignore on line only for non-user-facing literals.\n',
    );
    process.exit(1);
  }

  console.log(`✅ No hardcoded user-facing strings detected (${files.length} files scanned)`);
}

main();
