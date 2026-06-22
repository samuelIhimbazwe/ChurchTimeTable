/**
 * TEMPORARY — delete once all callers migrated to capability checks.
 * Maps legacy permission strings (any style) to contribution capability IDs.
 * One legacy key may expand to multiple capabilities.
 */
export const LEGACY_PERMISSION_ALIASES: Record<string, readonly string[]> = {
  'choir.contribution.submit': ['choir.contribution.submit@self'],
  'choir.contribution.view.all': ['choir.contribution.view@choir'],
  'choir.contribution.view.family': ['choir.contribution.view@family'],
  'choir.contribution.approve.family': ['choir.contribution.approve@family'],
  'choir.contribution.adjust': ['choir.contribution.adjust@choir'],
  'choir.contribution.type.manage': ['choir.contribution.catalog.manage@choir'],
  'choir.contribution.campaign.manage': ['choir.contribution.catalog.manage@choir'],
  'choir.finance.approve': ['choir.contribution.verify@choir'],
  'choir.finance.manage': [
    'choir.contribution.verify@choir',
    'choir.budget.manage@choir',
    'choir.budget.close@choir',
  ],
  'choir.finance.view': [
    'choir.contribution.view@choir',
    'choir.budget.view@choir',
  ],
  'finance:view': ['choir.contribution.view@choir', 'choir.budget.view@choir'],
  'finance:write': ['choir.budget.manage@choir'],
  'choir.family.manage': ['choir.contribution.oversight@choir'],
  'choir.welfare.view': ['choir.welfare.view@choir'],
  'choir.welfare.manage': ['choir.welfare.manage@choir'],
};
