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
      hasChoirOperations(permissions) ||
      permissions.contains('report:export');
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

bool canMarkAttendance(List<String> permissions) {
  return hasAnyEffectivePermission(permissions, [
    'attendance:write',
    protocolAttendanceManage,
    choirAttendanceManage,
    'attendance.mark',
  ]);
}
