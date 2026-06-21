/// Mirrors backend/web governance permission helpers.

const protocolOversight = 'protocol.oversight';
const protocolTeamManage = 'protocol.team.manage';
const protocolTeamHead = 'protocol.team.head';
const protocolOperationalMonitor = 'protocol.operational.monitor';
const protocolAttendanceManage = 'protocol.attendance.manage';
const choirOversight = 'choir.oversight';
const choirOperationsManage = 'choir.operations.manage';
const choirAttendanceManage = 'choir.attendance.manage';

bool hasEffectivePermission(List<String> permissions, String claim) {
  if (permissions.contains(claim)) return true;
  return permissions.any(
    (p) => p.startsWith('committee:') && p.endsWith(':$claim'),
  );
}

bool hasAnyEffectivePermission(List<String> permissions, List<String> claims) {
  return claims.any((c) => hasEffectivePermission(permissions, c));
}

bool hasProtocolOversight(List<String> permissions) {
  return hasEffectivePermission(permissions, protocolOversight);
}

bool hasProtocolCoordination(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    protocolTeamManage,
    protocolOperationalMonitor,
  ]);
}

bool hasProtocolTeamHead(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    protocolTeamHead,
    'attendance.mark',
    protocolAttendanceManage,
  ]);
}

bool hasChoirOperations(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    choirOversight,
    choirOperationsManage,
    'choir.events.manage',
    choirAttendanceManage,
  ]);
}

bool hasOperationalLeaderDashboard(List<String> permissions) {
  return hasProtocolOversight(permissions) ||
      hasProtocolCoordination(permissions) ||
      hasProtocolTeamHead(permissions) ||
      hasChoirOperations(permissions);
}

const leaderDashboardAccessPermissions = [
  protocolOversight,
  protocolTeamManage,
  protocolOperationalMonitor,
  protocolTeamHead,
  'attendance.mark',
  protocolAttendanceManage,
  choirOversight,
  choirOperationsManage,
  'choir.events.manage',
  choirAttendanceManage,
  'member:manage',
  'event:write',
  'assignment:write',
  'attendance:write',
  'swap:manage',
  'discipline:manage',
  'family:manage',
];

bool canAccessLeaderDashboard(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, leaderDashboardAccessPermissions);
}

const attendanceAccessPermissions = [
  'event:read',
  'attendance:write',
  'attendance.mark',
  protocolAttendanceManage,
  protocolTeamHead,
  protocolTeamManage,
  protocolOversight,
  protocolOperationalMonitor,
  choirAttendanceManage,
  choirOversight,
  choirOperationsManage,
];

const coverageAccessPermissions = [
  'event:read',
  'swap:manage',
  protocolTeamHead,
  protocolTeamManage,
  protocolOversight,
  protocolOperationalMonitor,
];

const financeAccessPermissions = [
  'choir.finance.view',
  'choir.finance.manage',
  'choir.finance.approve',
  'protocol.finance.view',
  'protocol.finance.manage',
  'protocol.finance.approve',
  'ministry.finance.oversight',
  protocolOversight,
  'finance.view',
];

bool canAccessAttendanceNav(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, attendanceAccessPermissions);
}

bool canAccessCoverageNav(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, coverageAccessPermissions);
}

bool canAccessFinanceNav(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, financeAccessPermissions);
}

/// Choir contribution capabilities from unified auth (when present on profile).
const contributionViewChoir = 'choir.contribution.view@choir';
const contributionVerifyChoir = 'choir.contribution.verify@choir';
const contributionSubmitSelf = 'choir.contribution.submit@self';
const contributionBudgetManage = 'choir.budget.manage@choir';

bool hasContributionCapability(
  List<Map<String, dynamic>>? capabilities,
  String capabilityId, {
  String? scopeId,
}) {
  if (capabilities == null || capabilities.isEmpty) return false;
  for (final cap in capabilities) {
    final id = cap['id']?.toString();
    if (id != capabilityId) continue;
    final capScopeId = cap['scopeId']?.toString();
    if (capabilityId.endsWith('@family') || capabilityId.endsWith('@sponsor')) {
      if (scopeId != null && capScopeId == scopeId) return true;
      continue;
    }
    return true;
  }
  return false;
}

bool canAccessFinanceNavWithCapabilities(
  List<String> permissions,
  List<Map<String, dynamic>>? capabilities,
) {
  if (hasContributionCapability(capabilities, contributionViewChoir) ||
      hasContributionCapability(capabilities, contributionVerifyChoir)) {
    return true;
  }
  return canAccessFinanceNav(permissions);
}

bool canAccessBudgetNavWithCapabilities(
  List<String> permissions,
  List<Map<String, dynamic>>? capabilities,
) {
  if (hasContributionCapability(capabilities, contributionBudgetManage) ||
      hasContributionCapability(capabilities, contributionVerifyChoir)) {
    return true;
  }
  return hasEffectivePermission(permissions, 'choir.finance.manage');
}

String? resolveOperationalDashboardRole(List<String> permissions) {
  if (hasProtocolOversight(permissions)) return 'president';
  if (hasProtocolCoordination(permissions)) return 'coordinator';
  if (hasProtocolTeamHead(permissions)) return 'team-head';
  if (hasChoirOperations(permissions)) return 'choir-leader';
  return null;
}

bool canManageCommitteeGovernance(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'committee.member.manage',
    'committee.role.manage',
    'member:manage',
  ]);
}

bool canViewFamilies(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, ['family:view', 'family:manage']);
}

bool canViewMinistries(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'ministry.view',
    'ministry.manage',
    'ministry.member.view',
    'ministry.member.manage',
  ]);
}

bool canViewOperationalUnits(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'operational_unit.view',
    'operational_unit.manage',
    'operational_unit.member.view',
    'operational_unit.member.manage',
  ]);
}

bool canViewAssets(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'asset.view',
    'asset.manage',
    'asset.report',
  ]);
}

bool canViewMinistryFinance(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'ministry.finance.view',
    'ministry.finance.manage',
    'ministry.finance.report',
    'ministry.finance.oversight',
  ]);
}

bool canViewChurchIntelligence(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'church.intelligence.view',
    'church.governance.view',
    'church.reports.view',
  ]);
}

bool canViewWelfare(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'choir.welfare.view',
    'choir.welfare.manage',
  ]);
}

bool canManageWelfare(List<String> permissions) {
  return hasEffectivePermission(permissions, 'choir.welfare.manage');
}

bool canViewDevotion(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'choir.devotion.view',
    'choir.devotion.create',
    'choir.devotion.publish',
    'choir.devotion.manage',
  ]);
}

bool canManageRehearsals(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'choir.rehearsal.manage',
    'choir.operations.manage',
  ]);
}

bool canViewMusic(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'choir.music.view',
    'choir.music.manage',
  ]);
}

bool canViewRehearsals(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'choir.rehearsal.view',
    'choir.rehearsal.manage',
    'choir.music.view',
    'choir.music.manage',
  ]);
}

bool canManageFamilies(List<String> permissions) {
  return hasEffectivePermission(permissions, 'family:manage');
}

bool canMarkAttendance(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'attendance:write',
    protocolAttendanceManage,
    choirAttendanceManage,
    'attendance.mark',
  ]);
}

const memberRead = 'member:read';

const memberRosterAccessPermissions = [
  memberRead,
  'assignment:write',
  'event:write',
  'member:manage',
  protocolOversight,
  protocolTeamManage,
  protocolOperationalMonitor,
  protocolTeamHead,
  choirOversight,
  choirOperationsManage,
];

bool canAccessMemberRoster(List<String> permissions) {
  return memberRosterAccessPermissions
      .any((p) => hasEffectivePermission(permissions, p));
}

bool canManageMemberDirectory(List<String> permissions) {
  return hasEffectivePermission(permissions, 'member:manage');
}

const adminAuditView = 'admin.audit.view';
const adminSyncManage = 'admin.sync.manage';
const adminSettingsView = 'admin.settings.view';

const platformAdminViewPermissions = [
  adminAuditView,
  adminSettingsView,
  'admin.users.view',
  'admin.roles.view',
  adminSyncManage,
];

bool canViewAdminAudit(List<String> permissions) {
  return hasEffectivePermission(permissions, adminAuditView);
}

bool canManageAdminSync(List<String> permissions) {
  return hasEffectivePermission(permissions, adminSyncManage);
}

bool hasPlatformAdminAccess(List<String> permissions) {
  return platformAdminViewPermissions
      .any((p) => hasEffectivePermission(permissions, p));
}
