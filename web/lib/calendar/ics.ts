export function buildIcsEvent(opts: {
  title: string
  startAt: string
  endAt?: string
  location?: string
  description?: string
}): string {
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const end = opts.endAt ?? opts.startAt
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CMMS//Choir//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@cmms`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(opts.startAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.title.replace(/\n/g, ' ')}`,
  ]
  if (opts.location) lines.push(`LOCATION:${opts.location.replace(/\n/g, ' ')}`)
  if (opts.description) lines.push(`DESCRIPTION:${opts.description.replace(/\n/g, ' ')}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type IcsEventInput = {
  title: string
  startAt: string
  endAt?: string
  location?: string
  description?: string
  uid?: string
}

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildIcsFeed(events: IcsEventInput[], calendarName = 'Choir calendar'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CMMS//Choir//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarName.replace(/\n/g, ' ')}`,
  ]

  for (const ev of events) {
    const end = ev.endAt ?? ev.startAt
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid ?? `${ev.startAt}-${ev.title}@cmms`}`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${formatIcsDate(ev.startAt)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${ev.title.replace(/\n/g, ' ')}`,
    )
    if (ev.location) lines.push(`LOCATION:${ev.location.replace(/\n/g, ' ')}`)
    if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, ' ')}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
