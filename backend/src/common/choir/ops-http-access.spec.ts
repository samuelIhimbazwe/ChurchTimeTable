import { OpsHttpAccessService } from './ops-http-access.service';
import { uiCapabilityVisible } from './ops-ui-capability-registry';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import type { ResolvedAuth } from './capability.types';

function mockOpsAccess(opsAuth: ResolvedAuth, musicAuth: ResolvedAuth) {
  const service = Object.create(OpsHttpAccessService.prototype) as OpsHttpAccessService;
  const opsResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(opsAuth),
    can: jest.fn((auth: ResolvedAuth, cap: string) =>
      auth.capabilities.some((c) => c.id === cap),
    ),
  };
  const musicResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(musicAuth),
  };
  const permissions = {
    resolveForUser: jest.fn().mockResolvedValue({ permissions: [] }),
  };
  Object.assign(service, { opsResolver, musicResolver, permissions });
  return service;
}

describe('ops HTTP access', () => {
  const choirId = '00000000-0000-0000-0000-000000000001';

  it('service prep view via rehearsal scoped capability', async () => {
    const opsAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.rehearsal.view@choir' }],
    };
    const service = mockOpsAccess(opsAuth, musicAuth);
    await expect(
      service.canOpsUi('u1', 'ops-scheduling-hub', [], choirId),
    ).resolves.toBe(true);
  });

  it('service prep manage via legacy operations manage', async () => {
    const opsAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockOpsAccess(opsAuth, musicAuth);
    await expect(
      service.canOpsUi('u1', 'ops-service-prep-manage', ['choir.operations.manage'], choirId),
    ).resolves.toBe(true);
  });

  it('registry matches scoped router for scheduling hub', () => {
    const check = buildCapabilityRouterFromAuths({
      opsAuth: {
        userId: 'u1',
        choirId,
        capabilities: [{ id: 'choir.ops.schedule@choir' }],
      },
      musicAuth: {
        userId: 'u1',
        choirId,
        capabilities: [],
      },
    });
    expect(uiCapabilityVisible('ops-scheduling-hub', check)).toBe(true);
  });

  it('member scheduling via legacy member read', async () => {
    const opsAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockOpsAccess(opsAuth, musicAuth);
    await expect(
      service.canOpsUi('u1', 'ops-member-scheduling', ['member:read'], choirId),
    ).resolves.toBe(true);
  });

  it('attendance manage via scoped capability', async () => {
    const opsAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.ops.attendance@choir' }],
    };
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockOpsAccess(opsAuth, musicAuth);
    await expect(
      service.canOpsUi('u1', 'ops-attendance-manage', [], choirId),
    ).resolves.toBe(true);
  });
});
