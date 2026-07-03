export type CalendarEventKind =
  | 'service'
  | 'rehearsal'
  | 'ministry'
  | 'protocol'
  | 'choir'
  | 'personal-choir'
  | 'personal-protocol'
  | 'other'

export type CalendarEventColor = {
  dot: string
  bg: string
  ring: string
  label: string
}

export const CALENDAR_EVENT_COLORS: Record<CalendarEventKind, CalendarEventColor> = {
  service: {
    dot: 'bg-primary-600',
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    ring: 'ring-primary-500/40',
    label: 'Service',
  },
  rehearsal: {
    dot: 'bg-success',
    bg: 'bg-success-light',
    ring: 'ring-success/40',
    label: 'Rehearsal',
  },
  ministry: {
    dot: 'bg-gold-600',
    bg: 'bg-gold-100 dark:bg-gold-900/30',
    ring: 'ring-gold-500/40',
    label: 'Ministry',
  },
  protocol: {
    dot: 'bg-info',
    bg: 'bg-info-light',
    ring: 'ring-info/40',
    label: 'Protocol',
  },
  choir: {
    dot: 'bg-gold-600',
    bg: 'bg-gold-50 dark:bg-gold-900/30',
    ring: 'ring-gold-500/40',
    label: 'Choir',
  },
  'personal-choir': {
    dot: 'bg-gold-600',
    bg: 'bg-gold-50 dark:bg-gold-900/30',
    ring: 'ring-gold-500/40',
    label: 'My choir',
  },
  'personal-protocol': {
    dot: 'bg-info',
    bg: 'bg-info-light',
    ring: 'ring-info/40',
    label: 'Protocol',
  },
  other: {
    dot: 'bg-text-muted',
    bg: 'bg-surface-overlay',
    ring: 'ring-border',
    label: 'Other',
  },
}

export function classifyChurchCalendarEvent(
  event: Record<string, unknown>,
): CalendarEventKind {
  if (event.kind === 'choir') {
    const t = String(event.activityType ?? event.type ?? '').toUpperCase()
    if (t.includes('REHEARSAL')) return 'rehearsal'
    if (t.includes('SERVICE') || t.includes('CONCERT')) return 'choir'
    return 'ministry'
  }
  const t = String(event.type ?? event.templateCode ?? '').toUpperCase()
  if (t.includes('PROTOCOL')) return 'protocol'
  if (t.includes('REHEARSAL')) return 'rehearsal'
  if (t.includes('SERVICE') || t === 'IGABURO') return 'service'
  if (t.includes('MINISTRY') || t.includes('PRAYER') || t.includes('ACTIVITY')) {
    return 'ministry'
  }
  return 'other'
}

export function classifyPersonalCalendarEvent(
  item: { ministry?: string; kind?: string },
): CalendarEventKind {
  if (item.ministry === 'PROTOCOL') return 'personal-protocol'
  if (item.ministry === 'CHOIR') {
    const k = String(item.kind ?? '').toUpperCase()
    if (k.includes('REHEARSAL')) return 'rehearsal'
    return 'personal-choir'
  }
  return 'other'
}

export function classifyChoirCalendarEvent(ev: {
  activityType?: string
  source?: string
}): CalendarEventKind {
  const t = String(ev.activityType ?? '').toUpperCase()
  if (t.includes('REHEARSAL')) return 'rehearsal'
  if (t.includes('SERVICE') || ev.source === 'choir_assignment') return 'service'
  return 'choir'
}
