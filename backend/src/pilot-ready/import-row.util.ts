export function rowVal(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

export function rowNum(row: Record<string, unknown>): number {
  return Number(row.__rowNumber ?? 0);
}
