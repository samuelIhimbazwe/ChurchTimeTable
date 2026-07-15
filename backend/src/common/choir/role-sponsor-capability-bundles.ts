import { ROLES } from '../constants/roles';

const REVIEW = 'choir.sponsor.review@choir' as const;
const MANAGE = 'choir.member.manage@choir' as const;

/** CMMS role name → choir-scoped sponsor capabilities. */
export const ROLE_SPONSOR_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [REVIEW, MANAGE],
  [ROLES.CHOIR_PRESIDENT]: [REVIEW, MANAGE],
  [ROLES.CHOIR_VICE_PRESIDENT]: [REVIEW],
};
