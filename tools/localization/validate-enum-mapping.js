#!/usr/bin/env node
/**
 * Ensures church_localization.dart maps all Prisma enums — no raw enum leakage in UI.
 */
const fs = require('fs');
const path = require('path');
const { repoRootFromTools } = require('./lib/arb');

const root = repoRootFromTools();
const schemaPath = path.join(root, 'backend', 'prisma', 'schema.prisma');
const churchLocPath = path.join(
  root,
  'mobile',
  'lib',
  'core',
  'localization',
  'church_localization.dart',
);

const ENUM_MAP = {
  SwapStatus: 'swapStatusLabel',
  ReplacementStatus: 'replacementStatusLabel',
  DisciplineStage: 'disciplineStageLabel',
};

const PHYSICAL_ATTENDANCE = ['PRESENT', 'ABSENT', 'LATE'];
const REASON_CATEGORY = ['EXCUSED', 'UNEXCUSED'];

function parsePrismaEnum(schema, enumName) {
  const re = new RegExp(`enum\\s+${enumName}\\s*\\{([^}]+)\\}`, 's');
  const m = schema.match(re);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'))
    .map((l) => l.replace(/,.*/, '').trim());
}

function extractSwitchCases(dart, methodName) {
  const re = new RegExp(
    `String\\s+${methodName}\\([^)]*\\)\\s*\\{([\\s\\S]*?)(?=\\n\\s*String\\s+|\\n\\})`,
  );
  const m = dart.match(re);
  if (!m) return new Set();
  const block = m[1];
  const cases = new Set();
  const caseRe = /case\s+'([^']+)'/g;
  let c;
  while ((c = caseRe.exec(block)) !== null) {
    cases.add(c[1]);
  }
  return cases;
}

function main() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const dart = fs.readFileSync(churchLocPath, 'utf8');
  const errors = [];

  const rawEnumReturn = /default\s*:\s*return\s+(status|stage)\s*;/g;
  if (rawEnumReturn.test(dart)) {
    errors.push(
      '❌ church_localization.dart returns raw enum in default branch — use enum_status_unknown',
    );
  }

  for (const [enumName, method] of Object.entries(ENUM_MAP)) {
    const expected = parsePrismaEnum(schema, enumName);
    const actual = extractSwitchCases(dart, method);
    for (const v of expected) {
      if (!actual.has(v)) {
        errors.push(
          `❌ Missing enum mapping:\n` +
            `   Enum: ${enumName}\n` +
            `   Value: ${v}\n` +
            `   Method: ${method}()`,
        );
      }
    }
    for (const v of actual) {
      if (!expected.includes(v)) {
        errors.push(
          `❌ Unknown enum case in ${method}():\n` +
            `   Value: ${v}\n` +
            `   Not in Prisma enum ${enumName}`,
        );
      }
    }
  }

  const attendanceCases = extractSwitchCases(dart, 'attendancePhysicalStatusLabel');
  for (const v of PHYSICAL_ATTENDANCE) {
    if (!attendanceCases.has(v)) {
      errors.push(`❌ Missing attendancePhysicalStatusLabel case: ${v}`);
    }
  }

  const reasonCases = extractSwitchCases(dart, 'attendanceReasonCategoryLabel');
  for (const v of REASON_CATEGORY) {
    if (!reasonCases.has(v)) {
      errors.push(`❌ Missing attendanceReasonCategoryLabel case: ${v}`);
    }
  }

  // ARB keys for swap statuses must exist
  const { loadAllArbs } = require('./lib/arb');
  const arbs = loadAllArbs(path.join(root, 'mobile', 'lib', 'l10n'));
  const swapKeys = [
    'swap_status_requested',
    'swap_status_target_accepted',
    'swap_status_target_rejected',
    'swap_status_leader_pending',
    'swap_status_approved',
    'swap_status_rejected',
    'swap_status_finalized',
    'swap_status_cancelled',
  ];
  for (const key of swapKeys) {
    for (const loc of ['rw', 'en', 'fr']) {
      if (!arbs[loc].entries.has(key)) {
        errors.push(`❌ Missing ARB key for enum label: ${key} (${loc})`);
      }
    }
  }

  if (errors.length) {
    console.error(`\nEnum localization validation failed (${errors.length} issue(s)):\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log('✅ Enum → localization mapping OK');
}

main();
