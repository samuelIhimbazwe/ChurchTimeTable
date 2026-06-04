import '../auth/governance_permissions.dart';
import '../auth/phone_enforcement.dart';
import 'app_router.dart';

const assignmentAccessPermissions = [
  'assignment:write',
  'event:write',
  'choir.oversight',
  'choir.operations.manage',
];

const familyAccessPermissions = [
  'family:view',
  'family:manage',
];

const welfareAccessPermissions = [
  'choir.welfare.view',
  'choir.welfare.manage',
];

const musicAccessPermissions = [
  'choir.music.view',
  'choir.music.manage',
];

const rehearsalAccessPermissions = [
  'choir.rehearsal.view',
  'choir.rehearsal.manage',
  'choir.music.view',
  'choir.music.manage',
];

const memberDirectoryAccessPermissions = [
  'member:manage',
];

const disciplineAccessPermissions = [
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
      return ['choir.finance.manage', ...financeAccessPermissions];
    case AppRouter.members:
      return memberDirectoryAccessPermissions;
    case AppRouter.families:
      return familyAccessPermissions;
    case AppRouter.welfare:
      return welfareAccessPermissions;
    case AppRouter.music:
      return musicAccessPermissions;
    case AppRouter.rehearsals:
      return rehearsalAccessPermissions;
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
    return canAccessLeaderDashboard(permissions);
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
  if (canAccessLeaderDashboard(permissions)) {
    return AppRouter.leaderDashboard;
  }
  return AppRouter.memberDashboard;
}
