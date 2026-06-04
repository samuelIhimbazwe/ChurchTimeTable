import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/core/routing/app_router.dart';
import 'package:cmms_mobile/core/routing/route_permissions.dart';

void main() {
  group('RoutePermissions', () {
    test('blocks finance route for event:read-only member', () {
      const permissions = ['event:read'];

      expect(canAccessRoute(AppRouter.finance, permissions), isFalse);
      expect(canAccessRoute(AppRouter.memberDashboard, permissions), isTrue);
      expect(canAccessRoute(AppRouter.calendar, permissions), isTrue);
    });

    test('allows finance route for scoped finance viewers', () {
      const permissions = ['event:read', 'choir.finance.view'];

      expect(canAccessRoute(AppRouter.finance, permissions), isTrue);
    });

    test('allows assignments for assignment writers', () {
      const permissions = ['event:read', 'assignment:write'];

      expect(canAccessRoute(AppRouter.assignments, permissions), isTrue);
      expect(canAccessRoute(AppRouter.finance, permissions), isFalse);
    });

    test('redirect target prefers leader dashboard for staff permissions', () {
      const permissions = ['event:read', 'assignment:write'];

      expect(
        dashboardRouteForPermissions(permissions),
        AppRouter.leaderDashboard,
      );
    });

    test('redirect target uses member dashboard for basic members', () {
      const permissions = ['event:read'];

      expect(
        dashboardRouteForPermissions(permissions),
        AppRouter.memberDashboard,
      );
    });
  });
}
