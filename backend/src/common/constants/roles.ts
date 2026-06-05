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
  /** Oversees all choir families/teams — first-class role (Sprint 10) */
  CHOIR_FAMILY_COORDINATOR: 'CHOIR_FAMILY_COORDINATOR',
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
  MEMBER_READ: 'member:read',
  FAMILY_VIEW: 'family:view',
  FAMILY_MANAGE: 'family:manage',
  /** Sprint 10 — choir family / contribution governance */
  CHOIR_FAMILY_VIEW: 'choir.family.view',
  CHOIR_FAMILY_MANAGE: 'choir.family.manage',
  CHOIR_CONTRIBUTION_SUBMIT: 'choir.contribution.submit',
  CHOIR_CONTRIBUTION_APPROVE_FAMILY: 'choir.contribution.approve.family',
  CHOIR_CONTRIBUTION_VIEW_FAMILY: 'choir.contribution.view.family',
  CHOIR_CONTRIBUTION_VIEW_ALL: 'choir.contribution.view.all',
  CHOIR_CONTRIBUTION_ADJUST: 'choir.contribution.adjust',
  CHOIR_CONTRIBUTION_TYPE_MANAGE: 'choir.contribution.type.manage',
  CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE: 'choir.contribution.campaign.manage',
  REPORT_EXPORT: 'report:export',
  /** @deprecated Legacy catalog entry — use scoped finance claims in runtime checks */
  AUDIT_READ: 'audit:read',
  /** @deprecated Legacy catalog entry — use admin.sync.manage in runtime checks */
  SYNC_ADMIN: 'sync:admin',

  // Platform administration (SUPER_ADMIN scope)
  ADMIN_USERS_VIEW: 'admin.users.view',
  ADMIN_USERS_MANAGE: 'admin.users.manage',
  ADMIN_ROLES_VIEW: 'admin.roles.view',
  ADMIN_ROLES_MANAGE: 'admin.roles.manage',
  ADMIN_SETTINGS_VIEW: 'admin.settings.view',
  ADMIN_SETTINGS_MANAGE: 'admin.settings.manage',
  ADMIN_AUDIT_VIEW: 'admin.audit.view',
  ADMIN_SYNC_MANAGE: 'admin.sync.manage',

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
  /** Choir MVP operations */
  CHOIR_WELFARE_VIEW: 'choir.welfare.view',
  CHOIR_WELFARE_MANAGE: 'choir.welfare.manage',
  CHOIR_MUSIC_VIEW: 'choir.music.view',
  CHOIR_MUSIC_MANAGE: 'choir.music.manage',
  CHOIR_REHEARSAL_VIEW: 'choir.rehearsal.view',
  CHOIR_REHEARSAL_MANAGE: 'choir.rehearsal.manage',
  CHOIR_ANNOUNCEMENT_MANAGE: 'choir.announcement.manage',
  CHOIR_DOCUMENT_MANAGE: 'choir.document.manage',
  CHOIR_MEETING_MANAGE: 'choir.meeting.manage',
  CHOIR_UNIFORM_MANAGE: 'choir.uniform.manage',
  CHOIR_EQUIPMENT_MANAGE: 'choir.equipment.manage',
  CHOIR_REPORTS_VIEW: 'choir.reports.view',
  CHOIR_DEVOTION_VIEW: 'choir.devotion.view',
  CHOIR_DEVOTION_CREATE: 'choir.devotion.create',
  CHOIR_DEVOTION_PUBLISH: 'choir.devotion.publish',
  CHOIR_DEVOTION_MANAGE: 'choir.devotion.manage',
  CHOIR_CUSTOM_ROLE_MANAGE: 'choir.custom_role.manage',

  /** Ministry Foundation (MF-1) — global ministry namespace */
  MINISTRY_VIEW: 'ministry.view',
  MINISTRY_CREATE: 'ministry.create',
  MINISTRY_MANAGE: 'ministry.manage',
  MINISTRY_MEMBER_VIEW: 'ministry.member.view',
  MINISTRY_MEMBER_MANAGE: 'ministry.member.manage',
  MINISTRY_LEADERSHIP_VIEW: 'ministry.leadership.view',
  MINISTRY_LEADERSHIP_MANAGE: 'ministry.leadership.manage',
  MINISTRY_SETTINGS_VIEW: 'ministry.settings.view',
  MINISTRY_SETTINGS_MANAGE: 'ministry.settings.manage',
  MINISTRY_REPORTS_VIEW: 'ministry.reports.view',

  /** Operational Units Foundation (MF-2) */
  OPERATIONAL_UNIT_VIEW: 'operational_unit.view',
  OPERATIONAL_UNIT_MANAGE: 'operational_unit.manage',
  OPERATIONAL_UNIT_MEMBER_VIEW: 'operational_unit.member.view',
  OPERATIONAL_UNIT_MEMBER_MANAGE: 'operational_unit.member.manage',
  OPERATIONAL_UNIT_LEADERSHIP_VIEW: 'operational_unit.leadership.view',
  OPERATIONAL_UNIT_LEADERSHIP_MANAGE: 'operational_unit.leadership.manage',
  OPERATIONAL_UNIT_SETTINGS_MANAGE: 'operational_unit.settings.manage',
  OPERATIONAL_UNIT_REPORTS_VIEW: 'operational_unit.reports.view',

  /** Ministry Services Platform (MF-3) */
  MINISTRY_ANNOUNCEMENT_VIEW: 'ministry.announcement.view',
  MINISTRY_ANNOUNCEMENT_MANAGE: 'ministry.announcement.manage',
  MINISTRY_DOCUMENT_VIEW: 'ministry.document.view',
  MINISTRY_DOCUMENT_MANAGE: 'ministry.document.manage',
  MINISTRY_MEETING_VIEW: 'ministry.meeting.view',
  MINISTRY_MEETING_MANAGE: 'ministry.meeting.manage',
  MINISTRY_DASHBOARD_VIEW: 'ministry.dashboard.view',
  MINISTRY_ACTIVITY_VIEW: 'ministry.activity.view',
  MINISTRY_REPORT_VIEW: 'ministry.report.view',

  /** Resource & Asset Management (MF-4) */
  ASSET_VIEW: 'asset.view',
  ASSET_CREATE: 'asset.create',
  ASSET_MANAGE: 'asset.manage',
  ASSET_ASSIGN: 'asset.assign',
  ASSET_MAINTAIN: 'asset.maintain',
  ASSET_REPORT: 'asset.report',
  ASSET_OWNERSHIP_MANAGE: 'asset.ownership.manage',
  ASSET_CUSTODIAN_MANAGE: 'asset.custodian.manage',

  /** Ministry Finance & Resource Funds (MF-5) */
  MINISTRY_FINANCE_VIEW: 'ministry.finance.view',
  MINISTRY_FINANCE_MANAGE: 'ministry.finance.manage',
  MINISTRY_FINANCE_EXPENSE_CREATE: 'ministry.finance.expense.create',
  MINISTRY_FINANCE_EXPENSE_APPROVE: 'ministry.finance.expense.approve',
  MINISTRY_FINANCE_REPORT: 'ministry.finance.report',

  /** Church Intelligence & Governance (MF-6) */
  CHURCH_INTELLIGENCE_VIEW: 'church.intelligence.view',
  CHURCH_INTELLIGENCE_MANAGE: 'church.intelligence.manage',
  CHURCH_REPORTS_VIEW: 'church.reports.view',
  CHURCH_REPORTS_EXPORT: 'church.reports.export',
  CHURCH_GOVERNANCE_VIEW: 'church.governance.view',
  CHURCH_GOVERNANCE_MANAGE: 'church.governance.manage',

  /** Local Church Operations & Scheduling (MF-7) */
  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_MANAGE: 'operations.manage',
  OPERATIONS_SCHEDULE_APPROVE: 'operations.schedule.approve',
  OPERATIONS_SCHEDULE_PUBLISH: 'operations.schedule.publish',
  OPERATIONS_ASSIGNMENT_MANAGE: 'operations.assignment.manage',
  OPERATIONS_ASSIGNMENT_CONFIRM: 'operations.assignment.confirm',
  OPERATIONS_OVERRIDE: 'operations.override',
  OPERATIONS_REPORT: 'operations.report',

  /** Protocol Operations Engine (PROTOCOL-1) */
  PROTOCOL_VIEW: 'protocol.view',
  PROTOCOL_MANAGE: 'protocol.manage',
  PROTOCOL_TEAM_APPROVE: 'protocol.team.approve',
  PROTOCOL_TEAM_PUBLISH: 'protocol.team.publish',
  PROTOCOL_REPLACEMENT_MANAGE: 'protocol.replacement.manage',
  PROTOCOL_RANKING_VIEW: 'protocol.ranking.view',
  PROTOCOL_REPORT: 'protocol.report',
  /** Protocol Operations Refinement (PROTOCOL-2) */
  PROTOCOL_TEAM_LEADER_MANAGE: 'protocol.team.leader.manage',
  PROTOCOL_TEAM_LEADER_EXECUTE: 'protocol.team.leader.execute',

  /** Choir Operations Engine (CHOIR-2) */
  CHOIR_OPS_VIEW: 'choir.ops.view',
  CHOIR_OPS_MANAGE: 'choir.ops.manage',
  CHOIR_OPS_SCHEDULE: 'choir.ops.schedule',
  CHOIR_OPS_ATTENDANCE: 'choir.ops.attendance',
  CHOIR_OPS_RANKING_VIEW: 'choir.ops.ranking.view',
  CHOIR_OPS_REPORT: 'choir.ops.report',

  /** Pilot readiness (PILOT-READY-1) */
  PILOT_IMPORT_MANAGE: 'pilot.import.manage',
  PILOT_BULK_MANAGE: 'pilot.bulk.manage',
  PILOT_EXPORT: 'pilot.export',
  PILOT_READINESS_VIEW: 'pilot.readiness.view',
  PILOT_SIMULATION_RUN: 'pilot.simulation.run',

  /** Member Portal (MEMBER-PORTAL-1) */
  MEMBER_PORTAL_VIEW: 'member.portal.view',
  CHOIR_JOIN_REVIEW: 'choir.join.review',
  PROTOCOL_INVITE: 'protocol.invite',
  PROTOCOL_CLAIM_REVIEW: 'protocol.claim.review',
} as const;

/** Per-unit permission codes on OperationalUnitPermissionAssignment */
export const OPERATIONAL_UNIT_SCOPED_PERMISSIONS = [
  'operational_unit.member.view',
  'operational_unit.member.manage',
  'operational_unit.leadership.manage',
  'operational_unit.reports.view',
  'operational_unit.settings.manage',
] as const;

export const OPERATIONAL_UNIT_GLOBAL_VIEW_PERMISSIONS = [
  PERMISSIONS.OPERATIONAL_UNIT_VIEW,
  PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
] as const;

export const OPERATIONAL_UNIT_GLOBAL_MANAGE_PERMISSIONS = [
  PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
] as const;

/** Per-ministry permission codes stored on MinistryPermissionAssignment */
export const MINISTRY_SCOPED_PERMISSIONS = [
  'ministry.member.view',
  'ministry.member.manage',
  'ministry.leadership.manage',
  'ministry.reports.view',
  'ministry.settings.manage',
  'ministry.finance.view',
  'ministry.finance.manage',
  'ministry.finance.expense.create',
  'ministry.finance.expense.approve',
  'ministry.finance.report',
] as const;

export const MINISTRY_GLOBAL_VIEW_PERMISSIONS = [
  PERMISSIONS.MINISTRY_VIEW,
  PERMISSIONS.MINISTRY_MANAGE,
] as const;

export const MINISTRY_GLOBAL_MANAGE_PERMISSIONS = [
  PERMISSIONS.MINISTRY_MANAGE,
] as const;

/** Legacy permissions kept in catalog for SUPER_ADMIN seed only — excluded from role grants and runtime checks */
export const LEGACY_RUNTIME_PERMISSIONS = [
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.SYNC_ADMIN,
  PERMISSIONS.FINANCE_READ,
  PERMISSIONS.FINANCE_WRITE,
] as const;

export const LEGACY_RUNTIME_PERMISSION_SET = new Set<string>(
  LEGACY_RUNTIME_PERMISSIONS,
);

export const CHOIR_OPS_ADMIN_PERMISSIONS = [
  PERMISSIONS.CHOIR_OPS_VIEW,
  PERMISSIONS.CHOIR_OPS_MANAGE,
  PERMISSIONS.CHOIR_OPS_SCHEDULE,
  PERMISSIONS.CHOIR_OPS_ATTENDANCE,
  PERMISSIONS.CHOIR_OPS_RANKING_VIEW,
  PERMISSIONS.CHOIR_OPS_REPORT,
  PERMISSIONS.CHOIR_JOIN_REVIEW,
] as const;

export const MEMBER_PORTAL_PERMISSIONS = [
  PERMISSIONS.MEMBER_PORTAL_VIEW,
  PERMISSIONS.CHOIR_JOIN_REVIEW,
  PERMISSIONS.PROTOCOL_INVITE,
  PERMISSIONS.PROTOCOL_CLAIM_REVIEW,
] as const;

export const PILOT_ADMIN_PERMISSIONS = [
  PERMISSIONS.PILOT_IMPORT_MANAGE,
  PERMISSIONS.PILOT_BULK_MANAGE,
  PERMISSIONS.PILOT_EXPORT,
  PERMISSIONS.PILOT_READINESS_VIEW,
  PERMISSIONS.PILOT_SIMULATION_RUN,
] as const;

/** Choir operational bundle — scoped claims only (no legacy finance/report) */
export const CHOIR_OPERATIONS_PERMS = [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.EVENT_WRITE,
  PERMISSIONS.ASSIGNMENT_WRITE,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.SWAP_MANAGE,
  PERMISSIONS.DISCIPLINE_READ_ALL,
  PERMISSIONS.DISCIPLINE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.MEMBER_READ,
  PERMISSIONS.FAMILY_VIEW,
  PERMISSIONS.FAMILY_MANAGE,
  PERMISSIONS.CHOIR_OVERSIGHT,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
  PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,
  ...CHOIR_OPS_ADMIN_PERMISSIONS,
] as const;

/** Platform-only claims — excluded from CHURCH_ADMIN operational bundle */
export const PLATFORM_ADMIN_PERMISSIONS = [
  PERMISSIONS.ADMIN_USERS_VIEW,
  PERMISSIONS.ADMIN_USERS_MANAGE,
  PERMISSIONS.ADMIN_ROLES_VIEW,
  PERMISSIONS.ADMIN_ROLES_MANAGE,
  PERMISSIONS.ADMIN_SETTINGS_VIEW,
  PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  PERMISSIONS.ADMIN_AUDIT_VIEW,
  PERMISSIONS.ADMIN_SYNC_MANAGE,
] as const;

export const PLATFORM_ADMIN_PERMISSION_SET = new Set<string>(
  PLATFORM_ADMIN_PERMISSIONS,
);

/** Scoped platform access groups (Phase 15 — no legacy dual-grant) */
export const ADMIN_AUDIT_ACCESS = [PERMISSIONS.ADMIN_AUDIT_VIEW] as const;

export const ADMIN_SYNC_ACCESS = [PERMISSIONS.ADMIN_SYNC_MANAGE] as const;

export const ADMIN_SETTINGS_ACCESS = [
  PERMISSIONS.ADMIN_SETTINGS_VIEW,
  PERMISSIONS.ADMIN_SETTINGS_MANAGE,
] as const;

export const FINANCE_VIEW_PERMISSIONS = [
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.FINANCE_VIEW_SCOPE,
] as const;

export const FINANCE_MANAGE_PERMISSIONS = [
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
] as const;

/** Ministry Foundation — church-wide ministry administration */
export const MINISTRY_ADMIN_PERMISSIONS = [
  PERMISSIONS.MINISTRY_VIEW,
  PERMISSIONS.MINISTRY_CREATE,
  PERMISSIONS.MINISTRY_MANAGE,
  PERMISSIONS.MINISTRY_MEMBER_VIEW,
  PERMISSIONS.MINISTRY_MEMBER_MANAGE,
  PERMISSIONS.MINISTRY_LEADERSHIP_VIEW,
  PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
  PERMISSIONS.MINISTRY_SETTINGS_VIEW,
  PERMISSIONS.MINISTRY_SETTINGS_MANAGE,
  PERMISSIONS.MINISTRY_REPORTS_VIEW,
  PERMISSIONS.MINISTRY_ANNOUNCEMENT_VIEW,
  PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
  PERMISSIONS.MINISTRY_DOCUMENT_VIEW,
  PERMISSIONS.MINISTRY_DOCUMENT_MANAGE,
  PERMISSIONS.MINISTRY_MEETING_VIEW,
  PERMISSIONS.MINISTRY_MEETING_MANAGE,
  PERMISSIONS.MINISTRY_DASHBOARD_VIEW,
  PERMISSIONS.MINISTRY_ACTIVITY_VIEW,
  PERMISSIONS.MINISTRY_REPORT_VIEW,
  PERMISSIONS.MINISTRY_FINANCE_VIEW,
  PERMISSIONS.MINISTRY_FINANCE_MANAGE,
  PERMISSIONS.MINISTRY_FINANCE_EXPENSE_CREATE,
  PERMISSIONS.MINISTRY_FINANCE_EXPENSE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_REPORT,
] as const;

export const MINISTRY_FINANCE_ADMIN_PERMISSIONS = [
  PERMISSIONS.MINISTRY_FINANCE_VIEW,
  PERMISSIONS.MINISTRY_FINANCE_MANAGE,
  PERMISSIONS.MINISTRY_FINANCE_EXPENSE_CREATE,
  PERMISSIONS.MINISTRY_FINANCE_EXPENSE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_REPORT,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
] as const;

export const ASSET_ADMIN_PERMISSIONS = [
  PERMISSIONS.ASSET_VIEW,
  PERMISSIONS.ASSET_CREATE,
  PERMISSIONS.ASSET_MANAGE,
  PERMISSIONS.ASSET_ASSIGN,
  PERMISSIONS.ASSET_MAINTAIN,
  PERMISSIONS.ASSET_REPORT,
  PERMISSIONS.ASSET_OWNERSHIP_MANAGE,
  PERMISSIONS.ASSET_CUSTODIAN_MANAGE,
] as const;

export const OPERATIONS_ADMIN_PERMISSIONS = [
  PERMISSIONS.OPERATIONS_VIEW,
  PERMISSIONS.OPERATIONS_MANAGE,
  PERMISSIONS.OPERATIONS_SCHEDULE_APPROVE,
  PERMISSIONS.OPERATIONS_SCHEDULE_PUBLISH,
  PERMISSIONS.OPERATIONS_ASSIGNMENT_MANAGE,
  PERMISSIONS.OPERATIONS_ASSIGNMENT_CONFIRM,
  PERMISSIONS.OPERATIONS_OVERRIDE,
  PERMISSIONS.OPERATIONS_REPORT,
] as const;

export const PROTOCOL_ADMIN_PERMISSIONS = [
  PERMISSIONS.PROTOCOL_INVITE,
  PERMISSIONS.PROTOCOL_CLAIM_REVIEW,
  PERMISSIONS.PROTOCOL_VIEW,
  PERMISSIONS.PROTOCOL_MANAGE,
  PERMISSIONS.PROTOCOL_TEAM_APPROVE,
  PERMISSIONS.PROTOCOL_TEAM_PUBLISH,
  PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
  PERMISSIONS.PROTOCOL_REPLACEMENT_MANAGE,
  PERMISSIONS.PROTOCOL_RANKING_VIEW,
  PERMISSIONS.PROTOCOL_REPORT,
  PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  PERMISSIONS.PROTOCOL_ASSIGNMENT_OVERRIDE,
  PERMISSIONS.PROTOCOL_TEAM_LEADER_MANAGE,
] as const;

export const CHURCH_INTELLIGENCE_ADMIN_PERMISSIONS = [
  PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  PERMISSIONS.CHURCH_INTELLIGENCE_MANAGE,
  PERMISSIONS.CHURCH_REPORTS_VIEW,
  PERMISSIONS.CHURCH_REPORTS_EXPORT,
  PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
] as const;

export const OPERATIONAL_UNIT_ADMIN_PERMISSIONS = [
  PERMISSIONS.OPERATIONAL_UNIT_VIEW,
  PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  PERMISSIONS.OPERATIONAL_UNIT_MEMBER_VIEW,
  PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
  PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_VIEW,
  PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
  PERMISSIONS.OPERATIONAL_UNIT_SETTINGS_MANAGE,
  PERMISSIONS.OPERATIONAL_UNIT_REPORTS_VIEW,
] as const;

/** Account administration only — no ministry finance, attendance, or governance */
export const CHURCH_ADMIN_ACCOUNT_PERMISSIONS = [
  PERMISSIONS.ADMIN_USERS_VIEW,
  PERMISSIONS.ADMIN_USERS_MANAGE,
  PERMISSIONS.ADMIN_ROLES_VIEW,
  PERMISSIONS.MEMBER_MANAGE,
] as const;

/** Church-wide operational admin (pilot, ministries, finance inbox, assets, etc.) */
export const CHURCH_ADMIN_OPERATIONAL_PERMISSIONS = [
  ...new Set([
    ...CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
    ...MINISTRY_ADMIN_PERMISSIONS,
    ...OPERATIONAL_UNIT_ADMIN_PERMISSIONS,
    ...ASSET_ADMIN_PERMISSIONS,
    ...MINISTRY_FINANCE_ADMIN_PERMISSIONS,
    ...CHURCH_INTELLIGENCE_ADMIN_PERMISSIONS,
    ...OPERATIONS_ADMIN_PERMISSIONS,
    ...PROTOCOL_ADMIN_PERMISSIONS,
    ...CHOIR_OPS_ADMIN_PERMISSIONS,
    ...PILOT_ADMIN_PERMISSIONS,
  ]),
] as const;
