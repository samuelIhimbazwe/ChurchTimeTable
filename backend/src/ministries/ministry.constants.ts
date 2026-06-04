export const MINISTRY_AUDIT_ACTIONS = {
  CREATED: 'MINISTRY_CREATED',
  UPDATED: 'MINISTRY_UPDATED',
  MEMBER_ADDED: 'MINISTRY_MEMBER_ADDED',
  MEMBER_REMOVED: 'MINISTRY_MEMBER_REMOVED',
  LEADERSHIP_ASSIGNED: 'MINISTRY_LEADERSHIP_ASSIGNED',
  LEADERSHIP_ENDED: 'MINISTRY_LEADERSHIP_ENDED',
  PERMISSION_GRANTED: 'MINISTRY_PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'MINISTRY_PERMISSION_REVOKED',
  SETTINGS_UPDATED: 'MINISTRY_SETTINGS_UPDATED',
} as const;

export const MINISTRY_AUDIT_ENTITY = 'Ministry';

/** Church-wide leadership (MF-1 — modeled as a ministry, titles only; permissions stay on roles) */
export const CHURCH_MINISTRY_CODE = 'CHURCH' as const;

export const DEFAULT_MINISTRIES = [
  {
    code: CHURCH_MINISTRY_CODE,
    name: 'Church Leadership',
    description: 'Parish / church-wide leadership (Pastor, officers, advisors)',
  },
  { code: 'MUSIC', name: 'Music Ministry', description: 'Choir and music worship ministry' },
  { code: 'DEACONS', name: "Deacons' Ministry", description: 'Deacons service ministry' },
  { code: 'YOUTH', name: 'Youth Ministry', description: 'Youth fellowship and outreach' },
  { code: 'WOMENS', name: "Women's Ministry", description: "Women's fellowship ministry" },
  { code: 'MENS', name: "Men's Ministry", description: "Men's fellowship ministry" },
  { code: 'EVANGELISM', name: 'Evangelism Ministry', description: 'Outreach and evangelism' },
  { code: 'INTERCESSORS', name: 'Intercessors Ministry', description: 'Prayer and intercession' },
  { code: 'ELDERLY', name: 'Elderly Ministry', description: 'Care and fellowship for elderly members' },
] as const;

export const CHURCH_LEADERSHIP_POSITIONS = [
  { name: 'Pastor', description: 'Senior pastor', isSystem: true },
  { name: 'Deputy Pastor', description: 'Deputy / assistant pastor', isSystem: true },
  { name: 'Secretary', description: 'Church secretary', isSystem: true },
  { name: 'Treasurer', description: 'Church treasurer', isSystem: true },
  { name: 'Advisor', description: 'Church advisor', isSystem: true },
] as const;

export const DEFAULT_LEADERSHIP_POSITIONS = [
  { name: 'President', description: 'Ministry president', isSystem: true },
  { name: 'Vice President', description: 'Ministry vice president', isSystem: true },
  { name: 'Secretary', description: 'Ministry secretary', isSystem: true },
  { name: 'Treasurer', description: 'Ministry treasurer', isSystem: true },
  { name: 'Advisor', description: 'Ministry advisor', isSystem: true },
] as const;

export function leadershipPositionsForMinistry(
  ministryCode: string,
): ReadonlyArray<{ name: string; description: string; isSystem: boolean }> {
  return ministryCode === CHURCH_MINISTRY_CODE
    ? CHURCH_LEADERSHIP_POSITIONS
    : DEFAULT_LEADERSHIP_POSITIONS;
}
