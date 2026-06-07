import {
  hasEffectivePermission,
  hasOperationalLeaderDashboard,
  hasPlatformAdminAccess,
  canViewAdminAudit,
  canManageAdminSync,
  isChurchOperationalAdmin,
  canAccessLeaderDashboard,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHeadAuthority,
  canViewFamilyContributionMetrics,
} from './governance-permissions.util';
import { PERMISSIONS, PLATFORM_ADMIN_PERMISSIONS } from '../constants/roles';

describe('governance-permissions.util', () => {
  it('resolves direct and committee-scoped claims', () => {
    expect(
      hasEffectivePermission(
        ['committee:protocol-ministry:protocol.oversight'],
        PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
      ),
    ).toBe(true);
    expect(hasEffectivePermission(['event:read'], 'protocol.oversight')).toBe(
      false,
    );
  });

  it('detects protocol hierarchy capabilities', () => {
    expect(
      hasProtocolOversight([PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE]),
    ).toBe(true);
    expect(
      hasProtocolCoordination([PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE]),
    ).toBe(true);
    expect(hasProtocolTeamHeadAuthority([PERMISSIONS.PROTOCOL_TEAM_HEAD])).toBe(
      true,
    );
  });

  it('does not grant leader dashboard from report:export alone', () => {
    expect(hasProtocolOversight([PERMISSIONS.REPORT_EXPORT])).toBe(false);
    expect(hasOperationalLeaderDashboard([PERMISSIONS.REPORT_EXPORT])).toBe(false);
    expect(canAccessLeaderDashboard([PERMISSIONS.REPORT_EXPORT])).toBe(false);
  });

  it('grants leader dashboard to church operational admin via member:manage', () => {
    expect(canAccessLeaderDashboard([PERMISSIONS.MEMBER_MANAGE])).toBe(true);
    expect(isChurchOperationalAdmin([PERMISSIONS.MEMBER_MANAGE])).toBe(true);
  });

  it('separates platform admin from church operational admin', () => {
    const churchAdmin = [
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.FAMILY_MANAGE,
    ];
    expect(hasPlatformAdminAccess(churchAdmin)).toBe(false);
    expect(isChurchOperationalAdmin(churchAdmin)).toBe(true);
    expect(canViewAdminAudit(churchAdmin)).toBe(false);
    expect(canManageAdminSync(churchAdmin)).toBe(false);
  });

  it('grants platform access via scoped admin.* claims only', () => {
    expect(canViewAdminAudit([PERMISSIONS.ADMIN_AUDIT_VIEW])).toBe(true);
    expect(canViewAdminAudit([PERMISSIONS.AUDIT_READ])).toBe(false);
    expect(canManageAdminSync([PERMISSIONS.ADMIN_SYNC_MANAGE])).toBe(true);
    expect(canManageAdminSync([PERMISSIONS.SYNC_ADMIN])).toBe(false);
    expect(hasPlatformAdminAccess([PERMISSIONS.ADMIN_SETTINGS_VIEW])).toBe(true);
    expect(PLATFORM_ADMIN_PERMISSIONS).toContain(PERMISSIONS.ADMIN_USERS_MANAGE);
  });

  it('scopes family contribution metrics to own family or coordinator/treasurer', () => {
    const presidentPerms = [
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ];
    expect(
      canViewFamilyContributionMetrics(presidentPerms, 'member-a', ['member-b']),
    ).toBe(false);
    expect(
      canViewFamilyContributionMetrics(presidentPerms, 'member-a', ['member-a']),
    ).toBe(true);
    expect(
      canViewFamilyContributionMetrics(
        [PERMISSIONS.CHOIR_FAMILY_MANAGE],
        undefined,
        ['member-b'],
      ),
    ).toBe(true);
    expect(
      canViewFamilyContributionMetrics(
        [PERMISSIONS.CHOIR_FINANCE_MANAGE],
        undefined,
        ['member-b'],
      ),
    ).toBe(true);
  });
});
