import { ImportJobType } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { ImportPreview } from './imports.service';
import type { ParsedImport } from './import-parser.util';
import { rowNum, rowVal } from './import-row.util';

export async function buildImportPreview(
  prisma: PrismaService,
  type: ImportJobType,
  parsed: ParsedImport,
): Promise<ImportPreview> {
  const validRows: Array<Record<string, unknown>> = [];
  const invalidRows: ImportPreview['invalidRows'] = [];
  const duplicateRows: ImportPreview['duplicateRows'] = [];
  const conflictRows: ImportPreview['conflictRows'] = [];
  const warningRows: ImportPreview['warningRows'] = [];
  const seen = new Set<string>();

  for (const row of parsed.rows) {
    const rowNumber = rowNum(row);
    const errors: string[] = [];
    validateRow(type, row, errors);

    if (errors.length > 0) {
      invalidRows.push({ row: rowNumber, errors, data: row });
      continue;
    }

    const dedupeKey = dedupeKeyFor(type, row);
    if (dedupeKey) {
      if (seen.has(dedupeKey)) {
        duplicateRows.push({
          row: rowNumber,
          reason: 'Duplicate row in file',
          data: row,
        });
        continue;
      }
      seen.add(dedupeKey);
    }

    const conflict = await detectConflict(prisma, type, row);
    if (conflict) {
      conflictRows.push({ row: rowNumber, reason: conflict, data: row });
      continue;
    }

    const warning = detectWarning(type, row);
    if (warning) {
      warningRows.push({ row: rowNumber, warning, data: row });
    }

    validRows.push({ ...row, __rowNumber: rowNumber });
  }

  return {
    validRows,
    invalidRows,
    duplicateRows,
    conflictRows,
    warningRows,
    summary: {
      total: parsed.rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      duplicates: duplicateRows.length,
      conflicts: conflictRows.length,
      warnings: warningRows.length,
    },
  };
}

function validateRow(type: ImportJobType, row: Record<string, string>, errors: string[]) {
  switch (type) {
    case 'MEMBERS':
      if (!row.email) errors.push('email required');
      if (!rowVal(row, 'firstname', 'first name')) errors.push('firstName required');
      if (!rowVal(row, 'lastname', 'last name')) errors.push('lastName required');
      break;
    case 'CHOIR_MEMBERS':
    case 'PROTOCOL_MEMBERS':
    case 'MINISTRY_MEMBERS':
    case 'LEADERSHIP_ASSIGNMENTS':
      if (!rowVal(row, 'email') && !rowVal(row, 'membernumber', 'member number')) {
        errors.push('email or memberNumber required');
      }
      break;
    case 'MINISTRIES':
      if (!rowVal(row, 'code')) errors.push('code required');
      if (!rowVal(row, 'name')) errors.push('name required');
      break;
    case 'ASSETS':
      if (!rowVal(row, 'code')) errors.push('code required');
      if (!rowVal(row, 'name')) errors.push('name required');
      break;
    case 'SCHEDULES':
      if (!rowVal(row, 'startat', 'start at', 'start')) errors.push('startAt required');
      break;
    default:
      break;
  }
  if (type === 'MINISTRY_MEMBERS' && !rowVal(row, 'ministrycode', 'ministry code', 'code')) {
    errors.push('ministryCode required');
  }
  if (type === 'LEADERSHIP_ASSIGNMENTS') {
    if (!rowVal(row, 'ministrycode', 'ministry code', 'code')) errors.push('ministryCode required');
    if (!rowVal(row, 'position', 'positionname', 'position name')) {
      errors.push('position required');
    }
  }
}

function dedupeKeyFor(type: ImportJobType, row: Record<string, string>): string | null {
  switch (type) {
    case 'MEMBERS':
      return rowVal(row, 'email').toLowerCase() || null;
    case 'MINISTRIES':
    case 'ASSETS':
      return rowVal(row, 'code').toLowerCase() || null;
    case 'CHOIR_MEMBERS':
      return `${rowVal(row, 'email', 'membernumber')}:${rowVal(row, 'choircode', 'code') || 'main'}`;
    case 'PROTOCOL_MEMBERS':
      return `${rowVal(row, 'email', 'membernumber')}:${rowVal(row, 'unitcode', 'code') || 'PROTOCOL_TEAM'}`;
    case 'MINISTRY_MEMBERS':
      return `${rowVal(row, 'email', 'membernumber')}:${rowVal(row, 'ministrycode', 'code')}`;
    case 'LEADERSHIP_ASSIGNMENTS':
      return `${rowVal(row, 'email', 'membernumber')}:${rowVal(row, 'ministrycode', 'code')}:${rowVal(row, 'position', 'positionname')}`;
    case 'SCHEDULES':
      return `${rowVal(row, 'title', 'code')}:${rowVal(row, 'startat', 'start')}`;
    default:
      return null;
  }
}

async function detectConflict(
  prisma: PrismaService,
  type: ImportJobType,
  row: Record<string, string>,
): Promise<string | null> {
  switch (type) {
    case 'MEMBERS': {
      const email = rowVal(row, 'email').toLowerCase();
      if (!email) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? 'Email already registered' : null;
    }
    case 'MINISTRIES': {
      const code = rowVal(row, 'code');
      const m = await prisma.ministry.findUnique({ where: { code } });
      return m ? 'Ministry code already exists' : null;
    }
    case 'ASSETS': {
      const code = rowVal(row, 'code');
      const a = await prisma.asset.findUnique({ where: { code } });
      return a ? 'Asset code already exists' : null;
    }
    default:
      return null;
  }
}

function detectWarning(type: ImportJobType, row: Record<string, string>): string | null {
  if (type === 'MEMBERS' && !row.phone) {
    return 'No phone — contributions may require phone later';
  }
  if (type === 'CHOIR_MEMBERS' && !rowVal(row, 'choircode', 'choir code', 'code')) {
    return 'choirCode omitted — will default to main choir';
  }
  return null;
}
