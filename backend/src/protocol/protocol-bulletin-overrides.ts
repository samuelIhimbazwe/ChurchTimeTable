export type ProtocolBulletinOverrides = {
  churchName?: string
  title?: string
  footerLines?: string[]
  weekTitles?: Record<string, string>
  serviceHeaders?: Record<string, string>
  cellTexts?: Record<string, string>
  igaburoTitles?: Record<string, string>
}

export function mergeBulletinOverrides(
  current: ProtocolBulletinOverrides | null | undefined,
  patch: ProtocolBulletinOverrides,
): ProtocolBulletinOverrides {
  const base = current ?? {}
  return {
    ...base,
    ...patch,
    weekTitles: { ...base.weekTitles, ...patch.weekTitles },
    serviceHeaders: { ...base.serviceHeaders, ...patch.serviceHeaders },
    cellTexts: { ...base.cellTexts, ...patch.cellTexts },
    igaburoTitles: { ...base.igaburoTitles, ...patch.igaburoTitles },
  }
}

export function parseBulletinOverrides(
  value: unknown,
): ProtocolBulletinOverrides | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as ProtocolBulletinOverrides
}

export type BulletinPlanRecord = {
  bulletinOverrides?: unknown
}

export function readPlanBulletinOverrides(
  plan: BulletinPlanRecord | null | undefined,
): ProtocolBulletinOverrides | null {
  return parseBulletinOverrides(plan?.bulletinOverrides)
}
