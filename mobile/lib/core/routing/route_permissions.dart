import '../auth/governance_permissions.dart';
import '../auth/phone_enforcement.dart';
import 'app_router.dart';

final financeAccessPermissions = [
  'finance:read',
  'finance:write',
  'choir.finance.view',
  'choir.finance.manage',
  'choir.finance.approve',
  'protocol.finance.view',
  'protocol.finance.manage',
  'protocol.finance.approve',
  'ministry.finance.oversight',
  'protocol.oversight',
];

final assignmentAccessPermissions = [
  'assignment:write',
  'event:write',
  'choir.oversight',
  'choir.operations.manage',
];

final attendanceAccessPermissions = [
  'event:read',
  'attendance:write',
  'attendance.mark',
  'protocol.attendance.manage',
  'protocol.team.head',
  'protocol.team.manage',
  'protocol.operational.monitor',
  'protocol.oversight',
  'choir.attendance.manage',
  'choir.oversight',
  'choir.operations.manage',
  'report:export',
];

final coverageAccessPermissions = [
  'event:read',
  'swap:manage',
  'protocol.team.head',
  'protocol.team.manage',
  'protocol.oversight',
  'protocol.operational.monitor',
  'report:export',
];

final memberDirectoryAccessPermissions = [
  'member:manage',
];

final disciplineAccessPermissions = [
  'discipline:read_all',
  'discipline:manage',
];

/// Returns `null` when any authenticated user may access the route.
List<String>? requiredPermissionsForRoute(String routeName) {
  switch (routeName) {
    case AppRouter.leaderDashboard:
    case AppRouter.memberDashboard:
    case AppRouter.operational:
    case AppRouter.settings:
    case AppRouter.language:
    case AppRouter.sync:
    case AppRouter.notifications:
    case AppRouter.myContributions:
      return null;
    case AppRouter.calendar:
      return ['event:read'];
    case AppRouter.assignments:
    case AppRouter.choirRotation:
      return assignmentAccessPermissions;
    case AppRouter.attendance:
      return attendanceAccessPermissions;
    case AppRouter.coverage:
    case AppRouter.swaps:
    case AppRouter.replacements:
      return coverageAccessPermissions;
    case AppRouter.discipline:
      return disciplineAccessPermissions;
    case AppRouter.finance:
      return financeAccessPermissions;
    case AppRouter.budgets:
      return ['finance:write', ...financeAccessPermissions];
    case AppRouter.members:
      return memberDirectoryAccessPermissions;
    default:
      return null;
  }
}

bool canAccessRoute(
  String routeName,
  List<String> permissions, {
  Map<String, dynamic>? profile,
}) {
  if (routeName == AppRouter.leaderDashboard) {
    return hasOperationalLeaderDashboard(permissions) ||
        permissions.contains('event:write') ||
        permissions.contains('assignment:write') ||
        canMarkAttendance(permissions) ||
        permissions.contains('swap:manage') ||
        permissions.contains('finance:write') ||
        permissions.contains('discipline:manage') ||
        permissions.contains('report:export');
  }

  if (routeName == AppRouter.operational) {
    return hasOperationalLeaderDashboard(permissions);
  }

  final required = requiredPermissionsForRoute(routeName);
  if (required == null) {
    if (profile != null &&
        !canAccessRouteWithPhoneEnforcement(routeName, profile)) {
      return false;
    }
    return true;
  }

  if (!hasAnyEffectivePermission(permissions, required)) {
    return false;
  }

  if (profile != null &&
      !canAccessRouteWithPhoneEnforcement(routeName, profile)) {
    return false;
  }

  return true;
}

String dashboardRouteForPermissions(List<String> permissions) {
  if (routeNameLooksLikeLeader(permissions)) {
    return AppRouter.leaderDashboard;
  }
  return AppRouter.memberDashboard;
}

bool routeNameLooksLikeLeader(List<String> permissions) {
  return hasOperationalLeaderDashboard(permissions) ||
      permissions.contains('event:write') ||
      permissions.contains('assignment:write') ||
      canMarkAttendance(permissions) ||
      permissions.contains('swap:manage') ||
      permissions.contains('finance:write') ||
      permissions.contains('discipline:manage') ||
      permissions.contains('report:export');
}
