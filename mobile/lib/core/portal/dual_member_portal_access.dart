/// Dual-member portal access — choir + protocol members only (mirrors web portal).
class DualMemberPortalAccess {
  const DualMemberPortalAccess({
    required this.isDualMember,
    required this.hasChoirMembership,
    required this.hasProtocolMembership,
    this.primaryChoirId,
  });

  final bool isDualMember;
  final bool hasChoirMembership;
  final bool hasProtocolMembership;
  final String? primaryChoirId;

  bool get canAccessPortal => isDualMember;

  /// Route name for [Navigator] when the user is not a dual member.
  String resolveRedirectRoute() {
    if (hasChoirMembership && primaryChoirId != null) {
      return '/choir/assignments';
    }
    if (hasProtocolMembership) {
      return '/protocol';
    }
    return '/member';
  }

  Object? resolveRedirectArguments() {
    if (hasChoirMembership && primaryChoirId != null) {
      return primaryChoirId;
    }
    return null;
  }

  static DualMemberPortalAccess fromHomeData(Map<String, dynamic>? data) {
    final participation =
        data?['participation'] as Map<String, dynamic>? ?? const {};
    final membership =
        data?['membership'] as Map<String, dynamic>? ?? const {};
    final choirs = membership['myChoirs'] as List? ?? const [];
    String? primaryChoirId;
    if (choirs.isNotEmpty) {
      final map = choirs.first as Map;
      final choir = map['choir'] as Map?;
      primaryChoirId =
          choir?['id']?.toString() ?? map['choirId']?.toString();
    }

    return DualMemberPortalAccess(
      isDualMember: participation['isDualMember'] == true,
      hasChoirMembership: participation['hasChoirMembership'] == true,
      hasProtocolMembership: participation['hasProtocolMembership'] == true,
      primaryChoirId: primaryChoirId,
    );
  }
}
