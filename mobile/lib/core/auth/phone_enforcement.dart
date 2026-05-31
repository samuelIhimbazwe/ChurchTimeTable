import '../routing/app_router.dart';

const _phoneExemptRoles = {'SUPER_ADMIN', 'CHURCH_ADMIN'};

const _enforcementStatuses = {'ACTIVE', 'PENDING'};

const _strictAllowedRoutes = {
  AppRouter.memberDashboard,
  AppRouter.leaderDashboard,
  AppRouter.operational,
  AppRouter.settings,
  AppRouter.language,
  AppRouter.notifications,
  AppRouter.myContributions,
};

class PhoneEnforcementState {
  const PhoneEnforcementState({
    required this.enabled,
    required this.mode,
    required this.blocked,
  });

  final bool enabled;
  final String mode;
  final bool blocked;
}

PhoneEnforcementState? parsePhoneEnforcement(Map<String, dynamic>? profile) {
  final raw = profile?['phoneEnforcement'];
  if (raw is! Map) {
    return null;
  }

  return PhoneEnforcementState(
    enabled: raw['enabled'] == true,
    mode: raw['mode']?.toString() ?? 'soft',
    blocked: raw['blocked'] == true,
  );
}

List<String> roleNamesFromProfile(Map<String, dynamic>? profile) {
  final fromApi = profile?['roles'] as List?;
  if (fromApi != null) {
    return fromApi.map((entry) => entry.toString()).toList();
  }

  final roles = profile?['userRoles'] as List?;
  if (roles == null) {
    return const [];
  }

  return roles
      .map((entry) => (entry as Map)['role']?['name']?.toString())
      .whereType<String>()
      .toList();
}

bool isPhoneEnforcementExempt(Map<String, dynamic>? profile) {
  return roleNamesFromProfile(profile)
      .any((role) => _phoneExemptRoles.contains(role));
}

bool memberMissingPhone(Map<String, dynamic>? profile) {
  if (profile == null || isPhoneEnforcementExempt(profile)) {
    return false;
  }

  final member = profile['member'] as Map?;
  if (member == null) {
    return false;
  }

  final status = member['status']?.toString();
  if (status == null || !_enforcementStatuses.contains(status)) {
    return false;
  }

  final phone = member['phone']?.toString();
  return phone == null || phone.isEmpty;
}

bool requiresPhone(Map<String, dynamic>? profile) {
  return memberMissingPhone(profile);
}

bool isStrictPhoneBlocked(Map<String, dynamic>? profile) {
  final enforcement = parsePhoneEnforcement(profile);
  if (enforcement == null || !enforcement.enabled) {
    return false;
  }
  if (enforcement.mode != 'strict') {
    return false;
  }
  return requiresPhone(profile);
}

bool canAccessRouteWithPhoneEnforcement(
  String routeName,
  Map<String, dynamic>? profile,
) {
  if (!isStrictPhoneBlocked(profile)) {
    return true;
  }
  return _strictAllowedRoutes.contains(routeName);
}

String phoneEnforcementRedirectRoute() {
  return AppRouter.settings;
}
