export type ImportColumnSpec = {
  key: string
  label: string
  required?: boolean
  aliases?: string[]
}

export const IMPORT_COLUMN_SPECS: Record<string, ImportColumnSpec[]> = {
  MEMBERS: [
    { key: 'email', label: 'Email', required: true },
    { key: 'firstname', label: 'First name', required: true, aliases: ['first name', 'firstName'] },
    { key: 'lastname', label: 'Last name', required: true, aliases: ['last name', 'lastName'] },
    { key: 'phone', label: 'Phone' },
    { key: 'membernumber', label: 'Member number', aliases: ['member number', 'memberNumber'] },
  ],
  CHOIR_MEMBERS: [
    { key: 'email', label: 'Email', aliases: ['membernumber', 'member number'] },
    { key: 'choircode', label: 'Choir code', aliases: ['choir code', 'code'] },
  ],
  PROTOCOL_MEMBERS: [
    { key: 'email', label: 'Email', aliases: ['membernumber', 'member number'] },
    { key: 'unitcode', label: 'Unit code', aliases: ['unit code', 'code'] },
  ],
  MINISTRIES: [
    { key: 'code', label: 'Code', required: true },
    { key: 'name', label: 'Name', required: true },
  ],
  MINISTRY_MEMBERS: [
    { key: 'email', label: 'Email', aliases: ['membernumber', 'member number'] },
    { key: 'ministrycode', label: 'Ministry code', required: true, aliases: ['ministry code', 'code'] },
  ],
  LEADERSHIP_ASSIGNMENTS: [
    { key: 'email', label: 'Email', aliases: ['membernumber', 'member number'] },
    { key: 'ministrycode', label: 'Ministry code', required: true, aliases: ['ministry code', 'code'] },
    { key: 'position', label: 'Position', required: true, aliases: ['positionname', 'position name'] },
  ],
  ASSETS: [
    { key: 'code', label: 'Code', required: true },
    { key: 'name', label: 'Name', required: true },
  ],
  SCHEDULES: [
    { key: 'title', label: 'Title' },
    { key: 'startat', label: 'Start', required: true, aliases: ['start at', 'start'] },
  ],
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

export function matchColumnToSpec(
  fileColumn: string,
  specs: ImportColumnSpec[],
): ImportColumnSpec | undefined {
  const n = norm(fileColumn)
  return specs.find((spec) => {
    if (norm(spec.key) === n) return true
    return spec.aliases?.some((a) => norm(a) === n)
  })
}

export async function readCsvHeaders(file: File): Promise<string[]> {
  const text = await file.slice(0, 4096).text()
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  if (!firstLine.trim()) return []
  return firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
}

export function detectColumnsFromPreviewRows(
  rows: Array<{ data?: Record<string, string> }>,
): string[] {
  const keys = new Set<string>()
  for (const row of rows) {
    if (!row.data) continue
    for (const k of Object.keys(row.data)) {
      if (k !== '__rowNumber') keys.add(k)
    }
  }
  return [...keys]
}
