import { ROLES } from '../constants/roles';

const VIEW = 'choir.member.view@choir' as const;
const MANAGE = 'choir.member.manage@choir' as const;

/** CMMS role name → choir-scoped roster capabilities. */
export const ROLE_ROSTER_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [VIEW, MANAGE],
  [ROLES.CHOIR_PRESIDENT]: [VIEW, MANAGE],
  [ROLES.CHOIR_VICE_PRESIDENT]: [VIEW],
  [ROLES.CHOIR_LEADER]: [VIEW, MANAGE],
  [ROLES.CHOIR_SECRETARY]: [VIEW],
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [VIEW, MANAGE],
  [ROLES.CHOIR_TREASURER]: [VIEW],
  [ROLES.CHOIR_COMMITTEE]: [VIEW],
  [ROLES.CHOIR_LOGISTICS]: [VIEW],
};
