import { ROLES } from '../constants/roles';

const VIEW = 'choir.ops.view@choir' as const;
const MANAGE = 'choir.ops.manage@choir' as const;
const SCHEDULE = 'choir.ops.schedule@choir' as const;
const ATTENDANCE = 'choir.ops.attendance@choir' as const;

const FULL_OPS = [VIEW, MANAGE, SCHEDULE, ATTENDANCE] as const;

/** CMMS role name → choir-scoped operations capabilities. */
export const ROLE_OPS_CAPABILITY_BUNDLES: Record<string, readonly string[]> = {
  [ROLES.MEMBER]: [VIEW],
  [ROLES.CHOIR_LEADER]: [...FULL_OPS],
  [ROLES.CHOIR_ADMIN]: [...FULL_OPS],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_OPS],
  [ROLES.CHOIR_VICE_PRESIDENT]: [...FULL_OPS],
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [...FULL_OPS],
  [ROLES.CHOIR_SECRETARY]: [VIEW, SCHEDULE, ATTENDANCE],
  [ROLES.CHOIR_COMMITTEE]: [VIEW],
};
