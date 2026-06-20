import type { SearchResult } from '@/lib/api/modules/search'

export type SearchScope =
  | 'all'
  | 'members'
  | 'songs'
  | 'activities'
  | 'cases'
  | 'finance'

export const SEARCH_SCOPES: Array<{ id: SearchScope; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'members', label: 'Members' },
  { id: 'songs', label: 'Songs' },
  { id: 'activities', label: 'Activities' },
  { id: 'cases', label: 'Cases' },
  { id: 'finance', label: 'Finance' },
]

const MEMBER_ENTITIES = new Set(['member', 'family', 'joinRequest', 'invitation'])
const SONG_ENTITIES = new Set(['song', 'songCategory'])
const ACTIVITY_ENTITIES = new Set([
  'event',
  'assignment',
  'schedule',
  'rehearsal',
  'choirMeeting',
  'choirDocument',
  'broadcast',
])
const CASE_ENTITIES = new Set(['welfareCase', 'welfareAssistance', 'welfareCategory'])
const FINANCE_ENTITIES = new Set(['contribution', 'ministryFinance'])

export function filterSearchByScope(
  results: SearchResult[],
  scope: SearchScope,
): SearchResult[] {
  if (scope === 'all') return results
  return results.filter((r) => {
    const entity = r.entityType ?? r.type
    switch (scope) {
      case 'members':
        return MEMBER_ENTITIES.has(entity) || r.type === 'member' || r.type === 'family'
      case 'songs':
        return SONG_ENTITIES.has(entity)
      case 'activities':
        return ACTIVITY_ENTITIES.has(entity) || r.type === 'occurrence' || r.type === 'activity'
      case 'cases':
        return CASE_ENTITIES.has(entity)
      case 'finance':
        return FINANCE_ENTITIES.has(entity)
      default:
        return true
    }
  })
}

export const POPULAR_SEARCH_HINTS = [
  'Roster',
  'Scheduling',
  'Music library',
  'Welfare',
  'Service prep',
] as const
