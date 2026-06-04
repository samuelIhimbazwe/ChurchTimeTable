import type { ParsedImport } from './import-parser.util';
import { parseDelimitedText } from './import-parser.util';

/** Parse first worksheet from XLSX buffer into the same shape as CSV import. */
export function parseXlsxBuffer(buffer: Buffer): ParsedImport {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx') as typeof import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];
  if (!matrix.length) {
    return { headers: [], rows: [] };
  }
  const headerRow = matrix[0].map((h) => String(h ?? '').trim().toLowerCase());
  const rows = matrix.slice(1).map((cells, index) => {
    const row: Record<string, string> = { __rowNumber: String(index + 2) };
    headerRow.forEach((h, i) => {
      if (!h) return;
      row[h] = String(cells[i] ?? '').trim();
    });
    return row;
  }).filter((row) => Object.keys(row).some((k) => k !== '__rowNumber' && row[k]));
  return { headers: headerRow.filter(Boolean), rows };
}

export function parseImportFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): ParsedImport {
  const isXlsx =
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls');
  if (isXlsx) {
    return parseXlsxBuffer(buffer);
  }
  return parseDelimitedText(buffer.toString('utf8'));
}
