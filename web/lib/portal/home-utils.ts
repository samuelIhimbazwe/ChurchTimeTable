import type { MemberPortalServiceCard } from '@/lib/api/modules/memberPortal'

/** Nearest upcoming service by nextOccurrence.startAt. */
export function pickNearestService(
  services: MemberPortalServiceCard[],
): MemberPortalServiceCard | null {
  const withNext = services.filter((s) => s.nextOccurrence?.startAt)
  if (withNext.length === 0) return null
  return [...withNext].sort(
    (a, b) =>
      new Date(a.nextOccurrence!.startAt).getTime()
      - new Date(b.nextOccurrence!.startAt).getTime(),
  )[0]
}
