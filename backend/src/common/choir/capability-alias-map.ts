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
  'discipline:read_all': ['choir.discipline.view@choir'],
  'discipline:manage': ['choir.discipline.manage@choir'],
  'discipline.review': ['choir.discipline.review@choir'],
  'choir.ops.view': ['choir.ops.view@choir'],
  'choir.ops.manage': ['choir.ops.manage@choir'],
  'choir.operations.manage': [
    'choir.ops.manage@choir',
    'choir.join.review@choir',
    'choir.sponsor.review@choir',
  ],
  'choir.ops.schedule': ['choir.ops.schedule@choir'],
  'choir.ops.attendance': ['choir.ops.attendance@choir'],
  'choir.attendance.manage': ['choir.ops.attendance@choir'],
  'choir.rehearsal.view': ['choir.ops.view@choir'],
  'choir.rehearsal.manage': [
    'choir.ops.manage@choir',
    'choir.ops.schedule@choir',
  ],
  'choir.oversight': ['choir.ops.view@choir'],
  'choir.ops.ranking.view': ['choir.ops.view@choir'],
  'choir.ops.report': ['choir.ops.view@choir'],
  'choir.reports.view': ['choir.ops.view@choir'],
  'choir.events.manage': ['choir.ops.manage@choir'],
  'event:write': ['choir.ops.manage@choir'],
  'event:read': ['choir.ops.view@choir'],
  'attendance.mark': ['choir.ops.attendance@choir'],
  'assignment:write': ['choir.ops.schedule@choir'],
  'choir.join.review': ['choir.join.review@choir'],
  'member:manage': ['choir.member.manage@choir'],
  'choir.sponsor.review': ['choir.sponsor.review@choir'],
};
