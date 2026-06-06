/** Morning service choir — may pair with one primary choir (see MEMBERSHIP_RULES.md). */
export const YERUSALEMU_CHOIR_CODE = 'YERUSALEMU'

export type ActiveChoirMembership = {
  id: string
  code: string
  name: string
  kind: string
}

export type PendingChoirJoinRequest = {
  id: string
  choirId: string
  choirName?: string
  choirCode?: string
  status: string
}

export type PortalChoirCard = {
  id: string
  code: string
  choirKind?: string
  joinStatus?: string | null
  isPublicJoinable?: boolean
  pendingRequestId?: string | null
}

export type ChoirPortalActions = {
  isActiveMember: boolean
  isPendingJoin: boolean
  showInList: boolean
  showJoinButton: boolean
  showDashboardButton: boolean
  joinBlockedByPending: boolean
  joinBlockedShortMessage: string | null
  joinBlockedMessage: string | null
  pendingRequestId: string | null
}

export function isYerusalemuChoir(choir: { code: string; choirKind?: string }) {
  return choir.code === YERUSALEMU_CHOIR_CODE || choir.choirKind === 'SPECIAL'
}

export function isPrimaryChoirKind(kind?: string) {
  return kind === 'PRIMARY' || kind === 'CHILDREN'
}

export function isPendingChoirJoin(status: string | null | undefined) {
  return status === 'PENDING' || status === 'NEEDS_INFO'
}

/** Approved singer — active choir membership record only (not a pending join request). */
export function isChoirActiveMember(
  activeMemberships: ActiveChoirMembership[],
  choirId: string,
) {
  return activeMemberships.some((m) => m.id === choirId)
}

export function getOpenPendingJoinRequest(
  pendingRequests: PendingChoirJoinRequest[],
): PendingChoirJoinRequest | undefined {
  return pendingRequests.find(
    (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
  )
}

/** Block joining choir B while a request to choir A is still open — except Yerusalemu targets. */
export function joinBlockedByPendingElsewhere(
  targetChoir: PortalChoirCard,
  openPending: PendingChoirJoinRequest | undefined,
): boolean {
  if (!openPending) return false
  if (openPending.choirId === targetChoir.id) return false
  if (isYerusalemuChoir(targetChoir)) return false
  return true
}

export function joinBlockedShortMessage(
  targetChoir: PortalChoirCard,
  openPending: PendingChoirJoinRequest | undefined,
): string | null {
  if (!joinBlockedByPendingElsewhere(targetChoir, openPending)) return null
  return 'Cancel your pending request first.'
}

export function joinBlockedMessage(
  targetChoir: PortalChoirCard,
  openPending: PendingChoirJoinRequest | undefined,
): string | null {
  if (!joinBlockedByPendingElsewhere(targetChoir, openPending)) return null
  const name = openPending!.choirName ?? 'another choir'
  return `You already have a pending request for ${name}. Each member may only have one open primary choir request at a time. Cancel that request first if you want to join a different choir. Yerusalemu (morning service) may still be requested separately while another request is pending.`
}

function summarizeMemberships(activeMemberships: ActiveChoirMembership[]) {
  const hasYerusalemu = activeMemberships.some((m) => m.code === YERUSALEMU_CHOIR_CODE)
  const hasPrimary = activeMemberships.some(
    (m) => m.code !== YERUSALEMU_CHOIR_CODE && isPrimaryChoirKind(m.kind),
  )
  const yerusalemuOnlyMember = hasYerusalemu && !hasPrimary
  return { hasYerusalemu, hasPrimary, yerusalemuOnlyMember }
}

function pendingRequestIdForChoir(
  choir: PortalChoirCard,
  pendingRequests: PendingChoirJoinRequest[],
): string | null {
  const fromList = pendingRequests.find(
    (r) =>
      r.choirId === choir.id &&
      (r.status === 'PENDING' || r.status === 'NEEDS_INFO'),
  )
  if (fromList) return fromList.id
  if (isPendingChoirJoin(choir.joinStatus) && choir.pendingRequestId) {
    return choir.pendingRequestId
  }
  return null
}

/**
 * Whether a choir appears in portal lists / profile URLs.
 * - No membership → every choir
 * - Primary member → own choir(s) + Yerusalemu (if not already a member)
 * - Yerusalemu-only → all choirs (can join a primary)
 */
export function shouldShowChoirInPortalList(
  activeMemberships: ActiveChoirMembership[],
  choir: PortalChoirCard,
): boolean {
  if (activeMemberships.length === 0) return true

  if (isChoirActiveMember(activeMemberships, choir.id)) return true

  const { hasYerusalemu, hasPrimary, yerusalemuOnlyMember } =
    summarizeMemberships(activeMemberships)

  if (hasPrimary) {
    return isYerusalemuChoir(choir) && !hasYerusalemu
  }

  if (yerusalemuOnlyMember) return true

  return false
}

/**
 * Portal choir list actions:
 * - No membership → Join on any joinable choir (never dashboard)
 * - One open pending request → Join blocked on other primaries; Yerusalemu still joinable
 * - Primary member → Dashboard on own choir; Join Yerusalemu only; hide other primaries
 */
export function resolveChoirPortalActions(
  activeMemberships: ActiveChoirMembership[],
  choir: PortalChoirCard,
  pendingRequests: PendingChoirJoinRequest[] = [],
): ChoirPortalActions {
  const isActiveMember = isChoirActiveMember(activeMemberships, choir.id)
  const pendingRequestId = pendingRequestIdForChoir(choir, pendingRequests)
  const isPendingJoin =
    isPendingChoirJoin(choir.joinStatus) || pendingRequestId != null
  const { hasYerusalemu, hasPrimary, yerusalemuOnlyMember } =
    summarizeMemberships(activeMemberships)
  const openPending = getOpenPendingJoinRequest(pendingRequests)
  const joinBlockedByPending = joinBlockedByPendingElsewhere(choir, openPending)

  const showInList = shouldShowChoirInPortalList(activeMemberships, choir)
  const showDashboardButton = isActiveMember

  let showJoinButton = false
  if (
    !isActiveMember &&
    !isPendingJoin &&
    choir.isPublicJoinable !== false &&
    showInList
  ) {
    if (activeMemberships.length === 0) {
      showJoinButton = true
    } else if (yerusalemuOnlyMember) {
      showJoinButton = !isYerusalemuChoir(choir)
    } else if (hasPrimary && isYerusalemuChoir(choir) && !hasYerusalemu) {
      showJoinButton = true
    }
  }

  return {
    isActiveMember,
    isPendingJoin,
    showInList,
    showJoinButton,
    showDashboardButton,
    joinBlockedByPending,
    joinBlockedShortMessage: joinBlockedShortMessage(choir, openPending),
    joinBlockedMessage: joinBlockedMessage(choir, openPending),
    pendingRequestId,
  }
}

/** Whether this choir profile URL may be opened in the member portal. */
export function canAccessChoirPortalProfile(actions: ChoirPortalActions) {
  return actions.showInList
}

export function filterVisiblePortalChoirs<T extends PortalChoirCard>(
  activeMemberships: ActiveChoirMembership[],
  choirs: T[],
): T[] {
  return choirs.filter((choir) =>
    shouldShowChoirInPortalList(activeMemberships, choir),
  )
}

export function normalizePendingChoirJoinRequests(
  requests?: Array<{
    id: string
    choirId: string
    choirName?: string
    status: string
    choir?: { name?: string; code?: string }
  }>,
): PendingChoirJoinRequest[] {
  if (!requests?.length) return []
  return requests.map((r) => ({
    id: r.id,
    choirId: r.choirId,
    choirName: r.choirName ?? r.choir?.name,
    choirCode: r.choir?.code,
    status: r.status,
  }))
}

export function normalizeActiveChoirMemberships(
  membership?: {
    activeChoirs?: Array<{ id: string; code: string; name: string; kind: string }>
    choirs?: Array<{
      choirId: string
      choir?: { name?: string; code?: string; choirKind?: string }
    }>
  },
): ActiveChoirMembership[] {
  if (membership?.activeChoirs?.length) {
    return membership.activeChoirs.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
    }))
  }

  if (membership?.choirs?.length) {
    return membership.choirs
      .filter((m) => m.choir)
      .map((m) => ({
        id: m.choirId,
        code: m.choir?.code ?? '',
        name: m.choir?.name ?? '',
        kind: m.choir?.choirKind ?? 'PRIMARY',
      }))
  }

  return []
}
