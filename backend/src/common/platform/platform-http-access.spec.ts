import { mapPermissionToPlatformCapabilities } from './platform-capability.util';
import { buildPlatformCapabilityRouter } from './platform-capability-router.util';
import { platformUiCapabilityVisible } from './platform-ui-capability-registry';

describe('platform HTTP access (capability + legacy)', () => {
  function platformCheckFromPermissions(permissions: string[]) {
    const mapped = permissions.flatMap(mapPermissionToPlatformCapabilities);
    const auths = {
      protocolAuth: {
        userId: 'test',
        choirId: '00000000-0000-0000-0000-000000000099',
        capabilities: mapped
          .filter((m) => m.domain === 'protocol')
          .map((m) => ({ id: m.id })),
      },
      churchAuth: {
        userId: 'test',
        choirId: 'church',
        capabilities: mapped
          .filter((m) => m.domain === 'church')
          .map((m) => ({ id: m.id })),
      },
      platformAuth: {
        userId: 'test',
        choirId: 'platform',
        capabilities: mapped
          .filter((m) => m.domain === 'platform')
          .map((m) => ({ id: m.id })),
      },
    };
    return buildPlatformCapabilityRouter(auths);
  }

  it('protocol invite via scoped capabilities', () => {
    const check = platformCheckFromPermissions(['protocol.invite']);
    expect(platformUiCapabilityVisible('protocol-invite', check)).toBe(true);
    expect(platformUiCapabilityVisible('protocol-invite', platformCheckFromPermissions([]))).toBe(false);
  });

  it('choir service schedule via scoped capabilities', () => {
    const check = platformCheckFromPermissions(['church.choir.ops.schedule']);
    expect(platformUiCapabilityVisible('choir-service-request-schedule', check)).toBe(true);
    expect(platformUiCapabilityVisible('choir-service-request-schedule', platformCheckFromPermissions([]))).toBe(false);
  });

  it('member manage via legacy alias', () => {
    const check = platformCheckFromPermissions(['member:manage']);
    expect(platformUiCapabilityVisible('member-manage', check)).toBe(true);
  });

  it('admin users manage via platform scope', () => {
    const check = platformCheckFromPermissions(['admin.users.manage']);
    expect(platformUiCapabilityVisible('admin-users-manage', check)).toBe(true);
  });

  it('protocol team operations caps', () => {
    const manage = platformCheckFromPermissions(['protocol.team.manage']);
    expect(platformUiCapabilityVisible('protocol-team-manage', manage)).toBe(true);
    const report = platformCheckFromPermissions(['protocol.report']);
    expect(platformUiCapabilityVisible('protocol-report', report)).toBe(true);
  });

  it('choir governance and admin settings caps', () => {
    const governance = platformCheckFromPermissions(['church.governance.manage']);
    expect(platformUiCapabilityVisible('choir-governance-manage', governance)).toBe(true);
    const settingsView = platformCheckFromPermissions(['admin.settings.view']);
    expect(platformUiCapabilityVisible('admin-settings-manage', settingsView)).toBe(true);
  });

  it('protocol view baseline', () => {
    const check = platformCheckFromPermissions(['protocol.view']);
    expect(platformUiCapabilityVisible('protocol-view', check)).toBe(true);
    const memberRead = platformCheckFromPermissions(['member:read']);
    expect(platformUiCapabilityVisible('protocol-view', memberRead)).toBe(true);
  });

  it('ministry platform and pilot readiness caps', () => {
    const ministry = platformCheckFromPermissions(['ministry.dashboard.view']);
    expect(platformUiCapabilityVisible('ministry-platform-view', ministry)).toBe(true);
    const pilot = platformCheckFromPermissions(['pilot.readiness.view']);
    expect(platformUiCapabilityVisible('pilot-readiness-view', pilot)).toBe(true);
    const usersView = platformCheckFromPermissions(['admin.users.view']);
    expect(platformUiCapabilityVisible('admin-users-manage', usersView)).toBe(true);
  });

  it('choir service request caps', () => {
    const serviceRequests = platformCheckFromPermissions(['church.governance.view']);
    expect(platformUiCapabilityVisible('choir-service-requests-view', serviceRequests)).toBe(true);
    const assignments = platformCheckFromPermissions(['church.choir.ops.schedule']);
    expect(platformUiCapabilityVisible('choir-service-assignments-view', assignments)).toBe(true);
  });
});
