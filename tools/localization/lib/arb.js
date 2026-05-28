const fs = require('fs');
const path = require('path');

const LOCALES = ['rw', 'en', 'fr'];
const METADATA_PREFIX = '@';

/**
 * @param {string} arbPath
 * @returns {{ locale: string, entries: Map<string, string>, meta: Map<string, object> }}
 */
function parseArbFile(arbPath) {
  const raw = fs.readFileSync(arbPath, 'utf8');
  const json = JSON.parse(raw);
  const locale = json['@@locale'] || path.basename(arbPath).replace('app_', '').replace('.arb', '');
  const entries = new Map();
  const meta = new Map();

  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith('@@')) continue;
    if (key.startsWith(METADATA_PREFIX)) {
      meta.set(key.slice(1), value);
      continue;
    }
    if (typeof value === 'string') {
      entries.set(key, value);
    }
  }

  return { locale, entries, meta, path: arbPath };
}

/**
 * @param {string} mobileL10nDir
 */
function loadAllArbs(mobileL10nDir) {
  const byLocale = {};
  for (const loc of LOCALES) {
    const p = path.join(mobileL10nDir, `app_${loc}.arb`);
    if (!fs.existsSync(p)) {
      throw new Error(`ARB file not found: ${p}`);
    }
    byLocale[loc] = parseArbFile(p);
  }
  return byLocale;
}

/** ICU-style {name} placeholders */
function extractPlaceholders(text) {
  const matches = text.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g);
  if (!matches) return new Set();
  return new Set(matches.map((m) => m.slice(1, -1)).sort());
}

function repoRootFromTools() {
  return path.resolve(__dirname, '..', '..', '..');
}

module.exports = {
  LOCALES,
  parseArbFile,
  loadAllArbs,
  extractPlaceholders,
  repoRootFromTools,
};
