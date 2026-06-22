import { ROLES } from '../constants/roles';

const REVIEW = 'choir.join.review@choir' as const;
const MANAGE = 'choir.member.manage@choir' as const;

/** CMMS role name → choir-scoped join / member capabilities. */
export const ROLE_JOIN_CAPABILITY_BUNDLES: Record<string, readonly string[]> = {
  [ROLES.CHOIR_ADMIN]: [REVIEW, MANAGE],
  [ROLES.CHOIR_PRESIDENT]: [REVIEW, MANAGE],
  [ROLES.CHOIR_VICE_PRESIDENT]: [REVIEW],
  [ROLES.CHOIR_LEADER]: [REVIEW, MANAGE],
};
