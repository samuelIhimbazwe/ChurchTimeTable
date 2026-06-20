import type { SearchResult } from '@/lib/api/modules/search'

/** Shape returned by GET /api/v1/search */
export type BackendSearchResponse = {
  query: string
  members?: Array<{ type: 'member'; id: string; displayName: string; memberNumber?: string | null }>
  families?: Array<{ type: 'family'; id: string; familyName: string; familyCode?: string }>
  events?: Array<{ type: 'event'; id: string; title: string }>
  assignments?: Array<{ type: 'assignment'; id: string; title: string }>
  choirs?: Array<{ type: 'choir'; id: string; title: string; code?: string }>
  ministries?: Array<{ type: 'ministry'; id: string; title: string; code?: string }>
  schedules?: Array<{ type: 'schedule'; id: string; title: string; status?: string }>
  songs?: Array<{ type: 'song'; id: string; title: string }>
  rehearsals?: Array<{ type: 'rehearsal'; id: string; title: string; eventId?: string }>
  choirDocuments?: Array<{ type: 'choirDocument'; id: string; title: string }>
  choirMeetings?: Array<{ type: 'choirMeeting'; id: string; title: string }>
  contributions?: Array<{ type: 'contribution'; id: string; referenceNumber: string }>
  welfareCases?: Array<{ type: 'welfareCase'; id: string; title: string; status?: string }>
  broadcasts?: Array<{ type: 'broadcast'; id: string; title: string }>
  joinRequests?: Array<{ type: 'joinRequest'; id: string; title: string; status?: string }>
  invitations?: Array<{ type: 'invitation'; id: string; title: string; status?: string }>
  operationalUnits?: Array<{ type: 'operationalUnit'; id: string; title: string; code?: string }>
  ministryContent?: Array<{ type: string; id: string; title: string }>
  assets?: Array<{ type: string; id: string; title: string }>
  ministryFinance?: Array<{ type: string; id: string; title: string }>
  churchIntelligence?: Array<{ type: string; id: string; title: string }>
  welfareCategories?: Array<{ type: 'welfareCategory'; id: string; name: string }>
  welfareAssistance?: Array<{ type: 'welfareAssistance'; id: string; title: string }>
  meetingDecisions?: Array<{ type: 'meetingDecision'; id: string; title: string }>
  meetingActionItems?: Array<{ type: 'meetingActionItem'; id: string; title: string }>
  songCategories?: Array<{ type: 'songCategory'; id: string; name: string }>
}

const DISPLAY_TYPE: Record<string, SearchResult['type']> = {
  member: 'member',
  family: 'family',
  event: 'occurrence',
  assignment: 'occurrence',
  schedule: 'occurrence',
  choir: 'choir',
  song: 'activity',
  rehearsal: 'activity',
  choirDocument: 'activity',
  choirMeeting: 'activity',
  meetingDecision: 'activity',
  meetingActionItems: 'activity',
  welfareCase: 'activity',
  welfareCategory: 'activity',
  welfareAssistance: 'activity',
  contribution: 'activity',
  broadcast: 'activity',
  joinRequest: 'activity',
  invitation: 'activity',
  ministry: 'activity',
  operationalUnit: 'activity',
  ministryContent: 'activity',
  asset: 'activity',
  ministryFinance: 'activity',
  churchIntelligence: 'activity',
  songCategory: 'activity',
}

function linkFor(type: string, id: string, title: string): string {
  switch (type) {
    case 'member':
      return `/members?search=${encodeURIComponent(title)}`
    case 'family':
      return '/choir/admin/families'
    case 'event':
    case 'assignment':
      return '/events'
    case 'choir':
      return `/portal/choirs/${id}`
    case 'ministry':
      return `/ministries/${id}`
    case 'schedule':
    case 'rehearsal':
      return '/choir/scheduling'
    case 'song':
    case 'songCategory':
      return '/choir/music'
    case 'choirDocument':
    case 'choirMeeting':
    case 'meetingDecision':
    case 'meetingActionItem':
      return '/choir/records'
    case 'contribution':
      return '/choir/finance'
    case 'welfareCase':
    case 'welfareCategory':
    case 'welfareAssistance':
      return '/choir/welfare'
    case 'broadcast':
      return '/announcements'
    case 'joinRequest':
      return '/choir/join-requests'
    case 'invitation':
      return '/portal/protocol'
    case 'operationalUnit':
      return '/church'
    default:
      return '/dashboard'
  }
}

function push(
  out: SearchResult[],
  type: string,
  id: string,
  title: string,
  subtitle?: string,
) {
  if (!id || !title) return
  out.push({
    id: `${type}-${id}`,
    type: DISPLAY_TYPE[type] ?? 'activity',
    entityType: type,
    title,
    subtitle,
    link: linkFor(type, id, title),
  })
}

export function adaptSearchResponse(raw: BackendSearchResponse): SearchResult[] {
  const results: SearchResult[] = []

  for (const m of raw.members ?? []) {
    push(results, 'member', m.id, m.displayName, m.memberNumber ?? undefined)
  }
  for (const f of raw.families ?? []) {
    push(results, 'family', f.id, f.familyName, f.familyCode)
  }
  for (const e of raw.events ?? []) {
    push(results, 'event', e.id, e.title, 'Service / event')
  }
  for (const a of raw.assignments ?? []) {
    push(results, 'assignment', a.id, a.title, 'Assignment')
  }
  for (const c of raw.choirs ?? []) {
    push(results, 'choir', c.id, c.title, c.code)
  }
  for (const m of raw.ministries ?? []) {
    push(results, 'ministry', m.id, m.title, m.code)
  }
  for (const s of raw.schedules ?? []) {
    push(results, 'schedule', s.id, s.title, s.status)
  }
  for (const s of raw.songs ?? []) {
    push(results, 'song', s.id, s.title, 'Song')
  }
  for (const r of raw.rehearsals ?? []) {
    push(results, 'rehearsal', r.id, r.title, 'Rehearsal')
  }
  for (const d of raw.choirDocuments ?? []) {
    push(results, 'choirDocument', d.id, d.title, 'Document')
  }
  for (const m of raw.choirMeetings ?? []) {
    push(results, 'choirMeeting', m.id, m.title, 'Meeting')
  }
  for (const c of raw.contributions ?? []) {
    push(results, 'contribution', c.id, c.referenceNumber, 'Contribution')
  }
  for (const w of raw.welfareCases ?? []) {
    push(results, 'welfareCase', w.id, w.title, w.status)
  }
  for (const b of raw.broadcasts ?? []) {
    push(results, 'broadcast', b.id, b.title, 'Announcement')
  }
  for (const j of raw.joinRequests ?? []) {
    push(results, 'joinRequest', j.id, j.title, j.status)
  }
  for (const i of raw.invitations ?? []) {
    push(results, 'invitation', i.id, i.title, i.status)
  }
  for (const u of raw.operationalUnits ?? []) {
    push(results, 'operationalUnit', u.id, u.title, u.code)
  }
  for (const item of raw.ministryContent ?? []) {
    push(results, 'ministryContent', item.id, item.title, 'Ministry content')
  }
  for (const item of raw.assets ?? []) {
    push(results, 'asset', item.id, item.title, 'Asset')
  }
  for (const item of raw.ministryFinance ?? []) {
    push(results, 'ministryFinance', item.id, item.title, 'Finance')
  }
  for (const item of raw.churchIntelligence ?? []) {
    push(results, 'churchIntelligence', item.id, item.title, 'Church insight')
  }
  for (const w of raw.welfareCategories ?? []) {
    push(results, 'welfareCategory', w.id, w.name, 'Welfare category')
  }
  for (const w of raw.welfareAssistance ?? []) {
    push(results, 'welfareAssistance', w.id, w.title, 'Welfare assistance')
  }
  for (const d of raw.meetingDecisions ?? []) {
    push(results, 'meetingDecision', d.id, d.title, 'Decision')
  }
  for (const a of raw.meetingActionItems ?? []) {
    push(results, 'meetingActionItem', a.id, a.title, 'Action item')
  }
  for (const s of raw.songCategories ?? []) {
    push(results, 'songCategory', s.id, s.name, 'Song category')
  }

  return results
}
