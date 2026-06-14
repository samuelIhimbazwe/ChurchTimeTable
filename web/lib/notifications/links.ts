/** Map backend notification `data.kind` to in-app routes. */
export function linkFromNotificationData(
  data?: Record<string, unknown> | null,
): string | undefined {
  if (!data) return undefined

  const explicit = data.link ?? data.href
  if (explicit != null && String(explicit).startsWith('/')) {
    return String(explicit)
  }

  const actionUrl = data.actionUrl
  if (actionUrl != null) {
    const url = String(actionUrl)
    if (url.startsWith('/')) return url
    try {
      const parsed = new URL(url)
      return `${parsed.pathname}${parsed.search}`
    } catch {
      return undefined
    }
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
    case 'contribution_thank_you':
      return '/portal/contributions'
    case 'choir_announcement':
      if (data.choirId) {
        return data.announcementId
          ? `/choir/${String(data.choirId)}/membership/announcements?id=${String(data.announcementId)}`
          : `/choir/${String(data.choirId)}/membership/announcements`
      }
      return undefined
    case 'choir_devotion':
      return '/portal/devotion'
    case 'choir_join_request_admin':
      if (data.choirId) {
        return data.requestId
          ? `/choir/${String(data.choirId)}/president/decisions?requestId=${String(data.requestId)}`
          : `/choir/${String(data.choirId)}/president/decisions`
      }
      return '/choir/join-requests'
    case 'protocol_assignment':
      if (data.occurrenceId) {
        return `/protocol/teams/${String(data.occurrenceId)}`
      }
      return '/portal/protocol'
    case 'protocol_replacement_approved':
    case 'protocol_replacement_request':
      if (data.requestId) {
        return `/protocol/replacements?requestId=${String(data.requestId)}`
      }
      return '/protocol/replacements'
    case 'protocol_claim_review':
      return '/protocol/claims'
    case 'protocol_invitation':
      return '/protocol/member'
    case 'contribution_family_approve':
    case 'contribution_approval_reminder':
      if (data.actionUrl && String(data.actionUrl).startsWith('/')) {
        return String(data.actionUrl)
      }
      if (data.familyId && data.choirId) {
        return `/choir/${String(data.choirId)}/family-leadership/decisions`
      }
      return '/portal/contributions'
    default:
      return undefined
  }
}
