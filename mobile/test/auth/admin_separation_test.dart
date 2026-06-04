import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/core/auth/governance_permissions.dart';

void main() {
  group('admin permission separation', () {
    test('CHURCH_ADMIN operational bundle lacks platform admin access', () {
      const churchOperational = [
        'member:manage',
        'event:read',
        'family:manage',
        'finance:read',
      ];

      expect(hasPlatformAdminAccess(churchOperational), isFalse);
      expect(canViewAdminAudit(churchOperational), isFalse);
      expect(canManageAdminSync(churchOperational), isFalse);
      expect(hasOperationalLeaderDashboard(churchOperational), isTrue);
    });

    test('platform admin access via scoped admin.* claims only', () {
      expect(canViewAdminAudit(['admin.audit.view']), isTrue);
      expect(canViewAdminAudit(['audit:read']), isFalse);
      expect(canManageAdminSync(['admin.sync.manage']), isTrue);
      expect(canManageAdminSync(['sync:admin']), isFalse);
      expect(hasPlatformAdminAccess(['admin.settings.view']), isTrue);
    });
  });

  group('navigation permission parity', () {
    test('report:export alone does not grant leader dashboard', () {
      expect(hasOperationalLeaderDashboard(['report:export']), isFalse);
      expect(canAccessLeaderDashboard(['report:export']), isFalse);
    });

    test('CHURCH_ADMIN operational bundle grants leader dashboard', () {
      const churchOperational = ['member:manage', 'event:read', 'family:manage'];
      expect(canAccessLeaderDashboard(churchOperational), isTrue);
    });

    test('attendance and coverage nav share constants', () {
      expect(
        canAccessAttendanceNav(['event:read']),
        isTrue,
      );
      expect(
        canAccessCoverageNav(['swap:manage']),
        isTrue,
      );
      expect(
        canAccessFinanceNav(['finance:read']),
        isFalse,
      );
      expect(
        canAccessFinanceNav(['choir.finance.view']),
        isTrue,
      );
    });
  });
}
