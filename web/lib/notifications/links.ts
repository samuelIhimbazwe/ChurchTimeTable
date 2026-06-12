/** Map backend notification `data.kind` to in-app routes. */
export function linkFromNotificationData(
  data?: Record<string, unknown> | null,
): string | undefined {
  if (!data) return undefined

  const explicit = data.link ?? data.href
  if (explicit != null && String(explicit).startsWith('/')) {
    return String(explicit)
  }

  const kind = String(data.kind ?? '')

  switch (kind) {
    case 'church_schedule_conflict_action':
    case 'church_schedule_daily_digest':
      return '/church/schedule/conflicts'
    case 'church_schedule_conflict_held':
    case 'church_schedule_auto_published':
    case 'church_schedule_published':
    case 'church_schedule_counter_proposed':
    case 'church_schedule_rejected':
      return '/church/schedule/mine'
    case 'church_schedule_timetable_updated':
    case 'church_schedule_entry_edited':
    case 'church_schedule_entry_cancelled':
      return '/church/timetable'
    default:
      return undefined
  }
}
