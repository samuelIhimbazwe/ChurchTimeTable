/** Profile settings — dual members use the portal; everyone else uses /account. */
export function accountProfilePath(isDualMember?: boolean): string {
  return isDualMember ? '/portal/profile' : '/account/profile'
}
