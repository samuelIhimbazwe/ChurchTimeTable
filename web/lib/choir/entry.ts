/** Join request / membership states that allow entering the choir dashboard. */

export function isActiveChoirJoinStatus(status: string | null | undefined) {

  if (!status) return false

  const s = status.toUpperCase()

  return s === 'APPROVED' || s === 'ACTIVE' || s === 'MEMBER'

}



/** Default landing inside a specific choir dashboard — always member home first. */

export function resolveChoirLandingPath(choirId: string): string {

  return `/choir/${choirId}/member`

}

