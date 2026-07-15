import { ROLES } from '../constants/roles';

const VIEW = 'choir.welfare.view@choir' as const;
const MANAGE = 'choir.welfare.manage@choir' as const;

/** CMMS role name → choir-scoped welfare capabilities. */
export const ROLE_WELFARE_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.MEMBER]: [VIEW],
  [ROLES.CHOIR_ADMIN]: [VIEW, MANAGE],
  [ROLES.CHOIR_PRESIDENT]: [VIEW, MANAGE],
  [ROLES.CHOIR_VICE_PRESIDENT]: [VIEW, MANAGE],
  /** Finance desk may see welfare spend context; care manage stays with care officers. */
  [ROLES.CHOIR_TREASURER]: [VIEW],
  [ROLES.CHOIR_COMMITTEE]: [VIEW],
};
