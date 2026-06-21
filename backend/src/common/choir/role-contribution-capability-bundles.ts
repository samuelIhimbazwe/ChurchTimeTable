import { ROLES } from '../constants/roles';

/** CMMS role name → choir-scoped contribution capabilities (no family scopeId). */
export const ROLE_CONTRIBUTION_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_TREASURER]: [
    'choir.contribution.verify@choir',
    'choir.contribution.view@choir',
    'choir.contribution.adjust@choir',
    'choir.contribution.catalog.manage@choir',
    'choir.budget.view@choir',
    'choir.budget.manage@choir',
    'choir.budget.close@choir',
  ],
  [ROLES.CHOIR_PRESIDENT]: [
    'choir.contribution.view@choir',
    'choir.budget.view@choir',
  ],
  [ROLES.CHOIR_VICE_PRESIDENT]: [
    'choir.contribution.view@choir',
    'choir.budget.view@choir',
  ],
  [ROLES.CHOIR_ADMIN]: [
    'choir.contribution.view@choir',
    'choir.contribution.verify@choir',
    'choir.contribution.adjust@choir',
    'choir.contribution.catalog.manage@choir',
    'choir.budget.view@choir',
    'choir.budget.manage@choir',
  ],
  [ROLES.CHOIR_LEADER]: [
    'choir.contribution.view@choir',
    'choir.budget.view@choir',
  ],
  [ROLES.CHOIR_COMMITTEE]: [
    'choir.contribution.view@choir',
    'choir.budget.view@choir',
  ],
  [ROLES.CHOIR_FAMILY_COORDINATOR]: [
    'choir.contribution.oversight@choir',
    'choir.contribution.view@choir',
  ],
  [ROLES.CHOIR_SECRETARY]: ['choir.contribution.view@choir'],
  [ROLES.MEMBER]: [
    'choir.contribution.submit@self',
    'choir.contribution.view@self',
  ],
};
