/** Choir-relative path tails for welfare capability surfaces. */
export const WELFARE_ROUTE_TAILS = [
  'welfare',
  'welfare/cases',
  'care/desk',
] as const

function normalizeTail(tail: string): string | null {
  if (tail.startsWith('welfare/cases/')) return 'welfare/cases'
  return (WELFARE_ROUTE_TAILS as readonly string[]).includes(tail) ? tail : null
}

export function welfareRouteTailFromPath(pathname: string): string | null {
  if (pathname === '/choir/welfare' || pathname === '/choir/welfare/') {
    return 'welfare'
  }
  if (pathname.startsWith('/choir/welfare/cases/')) {
    return 'welfare/cases'
  }
  if (pathname === '/choir/care/desk' || pathname === '/choir/care/desk/') {
    return 'care/desk'
  }
  const match = pathname.match(/^\/choir\/[^/]+\/(.+)$/)
  if (!match) return null
  const tail = match[1].replace(/\/$/, '')
  return normalizeTail(tail)
}

export function isWelfareRoutePath(pathname: string): boolean {
  return welfareRouteTailFromPath(pathname) != null
}
