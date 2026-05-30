export const ROLES = {
  MEMBER: 'MEMBER',
  /** Legacy — same access as CHOIR_PRESIDENT; prefer officer roles below */
  CHOIR_LEADER: 'CHOIR_LEADER',
  /** Choir officer positions (customize permissions in seed.ts) */
  CHOIR_PRESIDENT: 'CHOIR_PRESIDENT',
  CHOIR_VICE_PRESIDENT: 'CHOIR_VICE_PRESIDENT',
  CHOIR_SECRETARY: 'CHOIR_SECRETARY',
  CHOIR_TREASURER: 'CHOIR_TREASURER',
  /** Rehearsal / voice director — roster & attendance, not finance */
  CHOIR_REHEARSAL_DIRECTOR: 'CHOIR_REHEARSAL_DIRECTOR',
  CHOIR_LOGISTICS: 'CHOIR_LOGISTICS',
  PROTOCOL_LEADER: 'PROTOCOL_LEADER',
  CHOIR_COMMITTEE: 'CHOIR_COMMITTEE',
  CHURCH_ADMIN: 'CHURCH_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Legacy claims (kept for backward compatibility)
  EVENT_READ: 'event:read',
  EVENT_WRITE: 'event:write',
  ASSIGNMENT_WRITE: 'assignment:write',
  ATTENDANCE_WRITE: 'attendance:write',
  SWAP_MANAGE: 'swap:manage',
  DISCIPLINE_READ_ALL: 'discipline:read_all',
  DISCIPLINE_MANAGE: 'discipline:manage',
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  MEMBER_MANAGE: 'member:manage',
  REPORT_EXPORT: 'report:export',
  AUDIT_READ: 'audit:read',
  SYNC_ADMIN: 'sync:admin',

  // Scoped governance claims (incremental architecture evolution)
  FINANCE_VIEW_SCOPE: 'finance.view',
  ATTENDANCE_MARK_SCOPE: 'attendance.mark',
  DISCIPLINE_REVIEW_SCOPE: 'discipline.review',
  PROTOCOL_TEAM_MANAGE_SCOPE: 'protocol.team.manage',
  CHOIR_EVENTS_MANAGE_SCOPE: 'choir.events.manage',
  COMMITTEE_ROLE_MANAGE_SCOPE: 'committee.role.manage',
  COMMITTEE_MEMBER_MANAGE_SCOPE: 'committee.member.manage',
  PROTOCOL_OVERSIGHT_SCOPE: 'protocol.oversight',
  PROTOCOL_TEAM_HEAD: 'protocol.team.head',
  PROTOCOL_OPERATIONAL_MONITOR: 'protocol.operational.monitor',
  PROTOCOL_ASSIGNMENT_OVERRIDE: 'protocol.assignment.override',
  PROTOCOL_ATTENDANCE_MANAGE: 'protocol.attendance.manage',
  PROTOCOL_FINANCE_VIEW: 'protocol.finance.view',
  PROTOCOL_FINANCE_MANAGE: 'protocol.finance.manage',
  PROTOCOL_FINANCE_APPROVE: 'protocol.finance.approve',
  CHOIR_OVERSIGHT: 'choir.oversight',
  CHOIR_OPERATIONS_MANAGE: 'choir.operations.manage',
  CHOIR_ATTENDANCE_MANAGE: 'choir.attendance.manage',
  CHOIR_FINANCE_VIEW: 'choir.finance.view',
  CHOIR_FINANCE_MANAGE: 'choir.finance.manage',
  CHOIR_FINANCE_APPROVE: 'choir.finance.approve',
  MINISTRY_FINANCE_OVERSIGHT: 'ministry.finance.oversight',
} as const;

/** Choir operational bundle — president / legacy leader */
export const CHOIR_OPERATIONS_PERMS = [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.EVENT_WRITE,
  PERMISSIONS.ASSIGNMENT_WRITE,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.SWAP_MANAGE,
  PERMISSIONS.DISCIPLINE_READ_ALL,
  PERMISSIONS.DISCIPLINE_MANAGE,
  PERMISSIONS.FINANCE_READ,
  PERMISSIONS.REPORT_EXPORT,
] as const;
