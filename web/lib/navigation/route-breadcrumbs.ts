import type { BreadcrumbItem } from '@/components/shared/PageBreadcrumbs'
import { isChoirIdSegment } from '@/lib/choir/paths'

const SEGMENT_LABELS: Record<string, string> = {
  portal: 'Portal',
  choir: 'Choir',
  protocol: 'Protocol',
  notifications: 'Notifications',
  members: 'Roster',
  activities: 'Activities',
  scheduling: 'Scheduling',
  'service-preparation': 'Service prep',
  attendance: 'Attendance',
  welfare: 'Welfare',
  cases: 'Cases',
  analytics: 'Analytics',
  music: 'Music',
  membership: 'Membership',
  inbox: 'Inbox',
  family: 'Family',
  giving: 'Giving',
  obligations: 'To do',
  president: 'President',
  decisions: 'Decisions',
  finance: 'Finance',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
}

function labelForSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (isChoirIdSegment(segment)) return 'Choir'
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function breadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'
  if (path === '/' || path === '/portal') {
    return [{ label: 'Portal' }]
  }

  const segments = path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  let acc = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    acc += `/${seg}`
    const isLast = i === segments.length - 1
    if (isChoirIdSegment(seg)) {
      items.push({ label: 'Choir', href: isLast ? undefined : acc })
      continue
    }
    items.push({
      label: labelForSegment(seg),
      href: isLast ? undefined : acc,
    })
  }

  return items
}
