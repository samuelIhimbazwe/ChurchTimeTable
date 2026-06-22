import { ROLES } from '../constants/roles';

const VIEW = 'choir.devotion.view@choir' as const;
const CREATE = 'choir.devotion.create@choir' as const;
const PUBLISH = 'choir.devotion.publish@choir' as const;
const MANAGE = 'choir.devotion.manage@choir' as const;

const FULL_DEVOTION = [VIEW, CREATE, PUBLISH, MANAGE] as const;

/** CMMS role name → choir-scoped devotion capabilities. */
export const ROLE_DEVOTION_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.MEMBER]: [VIEW],
  [ROLES.CHOIR_ADMIN]: [...FULL_DEVOTION],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_DEVOTION],
  [ROLES.CHOIR_VICE_PRESIDENT]: [VIEW, PUBLISH],
  [ROLES.CHOIR_SECRETARY]: [VIEW],
  [ROLES.CHOIR_COMMITTEE]: [VIEW],
};
