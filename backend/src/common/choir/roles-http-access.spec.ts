import { RolesHttpAccessService } from './roles-http-access.service';
import { uiCapabilityVisible } from './roles-ui-capability-registry';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import type { ResolvedAuth } from './capability.types';

function mockRolesAccess(
  rolesAuth: ResolvedAuth,
  joinAuth?: ResolvedAuth,
) {
  const service = Object.create(RolesHttpAccessService.prototype) as RolesHttpAccessService;
  const rolesResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(rolesAuth),
    can: jest.fn((auth: ResolvedAuth, cap: string) =>
      auth.capabilities.some((c) => c.id === cap),
    ),
  };
  const joinResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(joinAuth),
  };
  const permissions = {
    resolveForUser: jest.fn().mockResolvedValue({ permissions: [] }),
  };
  Object.assign(service, {
    rolesResolver,
    joinResolver,
    permissions,
  });
  return { service, rolesResolver, joinResolver };
}

describe('roles HTTP access', () => {
  const choirId = '00000000-0000-0000-0000-000000000001';

  it('committee manage via scoped capabilities', async () => {
    const rolesAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.committee_role.manage@choir' }],
    };
    const { service } = mockRolesAccess(rolesAuth);
    await expect(
      service.canRolesUi('u1', 'roles-committee-manage', [], choirId),
    ).resolves.toBe(true);
  });

  it('custom role manage via legacy permission', async () => {
    const rolesAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const { service } = mockRolesAccess(rolesAuth);
    await expect(
      service.canRolesUi('u1', 'roles-custom-manage', ['choir.custom_role.manage'], choirId),
    ).resolves.toBe(true);
  });

  it('committee view via event read legacy', async () => {
    const rolesAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const { service } = mockRolesAccess(rolesAuth);
    await expect(
      service.canRolesUi('u1', 'roles-committee-view', ['event:read'], choirId),
    ).resolves.toBe(true);
  });

  it('registry matches scoped router for committee assign', () => {
    const check = buildCapabilityRouterFromAuths({
      rolesAuth: {
        userId: 'u1',
        choirId,
        capabilities: [{ id: 'choir.committee_member.manage@choir' }],
      },
      joinAuth: {
        userId: 'u1',
        choirId,
        capabilities: [],
      },
    });
    expect(uiCapabilityVisible('roles-committee-assign', check)).toBe(true);
  });
});
