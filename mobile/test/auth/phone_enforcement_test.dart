import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/core/auth/phone_enforcement.dart';
import 'package:cmms_mobile/core/routing/app_router.dart';
import 'package:cmms_mobile/core/routing/route_permissions.dart';

void main() {
  group('PhoneEnforcement', () {
    Map<String, dynamic> strictProfile({String? phone}) {
      return {
        'roles': ['MEMBER'],
        'permissions': ['event:read', 'attendance:write'],
        'member': {
          'status': 'ACTIVE',
          'phone': phone,
        },
        'phoneEnforcement': {
          'enabled': true,
          'mode': 'strict',
          'blocked': phone == null || phone.isEmpty,
        },
      };
    }

    test('allows dashboard and profile routes in strict mode', () {
      final profile = strictProfile();

      expect(
        canAccessRouteWithPhoneEnforcement(AppRouter.memberDashboard, profile),
        isTrue,
      );
      expect(
        canAccessRouteWithPhoneEnforcement(AppRouter.settings, profile),
        isTrue,
      );
      expect(
        canAccessRouteWithPhoneEnforcement(AppRouter.myContributions, profile),
        isTrue,
      );
    });

    test('blocks operational routes in strict mode', () {
      final profile = strictProfile();

      expect(
        canAccessRouteWithPhoneEnforcement(AppRouter.attendance, profile),
        isFalse,
      );
      expect(
        canAccessRouteWithPhoneEnforcement(AppRouter.finance, profile),
        isFalse,
      );
    });

    test('route permissions integrate phone enforcement', () {
      final profile = strictProfile();

      expect(
        canAccessRoute(
          AppRouter.attendance,
          ['event:read', 'attendance:write'],
          profile: profile,
        ),
        isFalse,
      );
      expect(
        canAccessRoute(
          AppRouter.myContributions,
          ['event:read'],
          profile: profile,
        ),
        isTrue,
      );
    });
  });
}
