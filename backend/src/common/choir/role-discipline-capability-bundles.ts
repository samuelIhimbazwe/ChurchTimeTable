import { ROLES } from '../constants/roles';

const VIEW = 'choir.discipline.view@choir' as const;
const MANAGE = 'choir.discipline.manage@choir' as const;
const REVIEW = 'choir.discipline.review@choir' as const;

/** CMMS role name → choir-scoped discipline capabilities. */
export const ROLE_DISCIPLINE_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [VIEW, MANAGE],
  [ROLES.CHOIR_PRESIDENT]: [VIEW, MANAGE],
  [ROLES.CHOIR_VICE_PRESIDENT]: [VIEW, MANAGE],
  [ROLES.CHOIR_SECRETARY]: [VIEW],
  [ROLES.CHOIR_COMMITTEE]: [VIEW, REVIEW],
};
