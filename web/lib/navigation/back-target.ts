import { isChoirIdSegment } from '@/lib/choir/paths'

export type BackTarget = {
  href: string
  label: string
}

const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** Routes where a back affordance is hidden (top-level hubs). */
const HUB_PATHS = new Set([
  '/portal',
  '/notifications',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
])

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].replace(/\/$/, '')
  return path || '/'
}

function choirIdFromPath(path: string): string | null {
  const match = path.match(new RegExp(`^/choir/(${UUID})(?:/|$)`, 'i'))
  if (!match) return null
  return isChoirIdSegment(match[1]) ? match[1] : null
}

type Rule = {
  pattern: RegExp
  resolve: (match: RegExpExecArray) => BackTarget
}

const RULES: Rule[] = [
  {
    pattern: new RegExp(`^/choir/(${UUID})/attendance/([^/]+)$`, 'i'),
    resolve: (m) => ({ href: `/choir/${m[1]}/activities`, label: 'Activities' }),
  },
  {
    pattern: /^\/choir\/attendance\/([^/]+)$/i,
    resolve: () => ({ href: '/choir/activities', label: 'Activities' }),
  },
  {
    pattern: new RegExp(`^/choir/(${UUID})/welfare/cases/([^/]+)$`, 'i'),
    resolve: (m) => ({ href: `/choir/${m[1]}/welfare`, label: 'Welfare' }),
  },
  {
    pattern: /^\/choir\/welfare\/cases\/([^/]+)$/i,
    resolve: () => ({ href: '/choir/welfare', label: 'Welfare' }),
  },
  {
    pattern: new RegExp(`^/choir/(${UUID})/service-preparation/([^/]+)$`, 'i'),
    resolve: (m) => ({
      href: `/choir/${m[1]}/service-preparation`,
      label: 'Service prep',
    }),
  },
  {
    pattern: /^\/choir\/service-preparation\/([^/]+)$/i,
    resolve: () => ({ href: '/choir/service-preparation', label: 'Service prep' }),
  },
  {
    pattern: new RegExp(`^/choir/(${UUID})/music/([^/]+)$`, 'i'),
    resolve: (m) => ({ href: `/choir/${m[1]}/music`, label: 'Music library' }),
  },
  {
    pattern: /^\/choir\/music\/([^/]+)$/i,
    resolve: () => ({ href: '/choir/music', label: 'Music library' }),
  },
  {
    pattern: new RegExp(`^/choir/(${UUID})/membership/([^/]+)$`, 'i'),
    resolve: (m) => ({ href: `/choir/${m[1]}/membership`, label: 'Home' }),
  },
  {
    pattern: new RegExp(`^/choir/(${UUID})/sponsor/songs/([^/]+)$`, 'i'),
    resolve: (m) => ({ href: `/choir/${m[1]}/sponsor/songs`, label: 'Sponsor songs' }),
  },
  {
    pattern: /^\/protocol\/teams\/([^/]+)$/i,
    resolve: () => ({ href: '/protocol/teams', label: 'Teams' }),
  },
  {
    pattern: /^\/ministries\/([^/]+)\/([^/]+)$/i,
    resolve: (m) => ({ href: `/ministries/${m[1]}`, label: 'Ministry' }),
  },
  {
    pattern: /^\/portal\/choirs\/([^/]+)$/i,
    resolve: () => ({ href: '/portal/choirs', label: 'Choirs' }),
  },
]

function labelForParent(path: string): string {
  const choirId = choirIdFromPath(path)
  if (choirId && path === `/choir/${choirId}`) return 'Choir'
  if (path === '/choir') return 'Choir'
  if (path.startsWith('/protocol')) return 'Protocol'
  if (path.endsWith('/membership')) return 'Choir'
  const last = path.split('/').filter(Boolean).pop() ?? ''
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Back'
}

export type BackTargetContext = {
  homePath?: string | null
  isDualMember?: boolean
}

function workspaceHome(ctx?: BackTargetContext): BackTarget {
  if (ctx?.isDualMember) {
    return { href: '/portal', label: 'Portal' }
  }
  const home = ctx?.homePath ?? '/dashboard'
  if (home.startsWith('/choir/')) return { href: home, label: 'Choir' }
  if (home.startsWith('/protocol')) return { href: home, label: 'Protocol' }
  return { href: home, label: 'Dashboard' }
}

/** Parent route when browser history is unavailable. */
export function resolveBackTarget(
  pathname: string,
  ctx?: BackTargetContext,
): BackTarget {
  const path = normalizePath(pathname)

  for (const rule of RULES) {
    const match = rule.pattern.exec(path)
    if (match) return rule.resolve(match)
  }

  const segments = path.split('/').filter(Boolean)
  if (segments.length <= 1) {
    return workspaceHome(ctx)
  }

  const parent = `/${segments.slice(0, -1).join('/')}`

  if (parent === '/choir') {
    return workspaceHome(ctx)
  }

  const choirId = choirIdFromPath(path)
  if (choirId && parent === `/choir/${choirId}`) {
    if (ctx?.isDualMember) {
      return { href: '/portal', label: 'Portal' }
    }
    return { href: `/choir/${choirId}/membership`, label: 'Choir' }
  }

  return { href: parent, label: labelForParent(parent) }
}

export function shouldShowBackButton(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (HUB_PATHS.has(path)) return false
  if (path === '/') return false
  return true
}
