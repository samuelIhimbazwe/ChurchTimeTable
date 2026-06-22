import { ROLES } from '../constants/roles';

const CUSTOM = 'choir.custom_role.manage@choir' as const;
const COMMITTEE = 'choir.committee_role.manage@choir' as const;

const FULL_ROLES = [CUSTOM, COMMITTEE] as const;

/** CMMS role name → choir-scoped role governance capabilities. */
export const ROLE_ROLES_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [...FULL_ROLES],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_ROLES],
};
