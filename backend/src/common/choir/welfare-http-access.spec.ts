import { WelfareHttpAccessService } from './welfare-http-access.service';
import type { ResolvedAuth } from './capability.types';

function mockWelfareAccess(welfareAuth: ResolvedAuth) {
  const service = Object.create(WelfareHttpAccessService.prototype) as WelfareHttpAccessService;
  const welfareResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(welfareAuth),
    can: jest.fn((auth: ResolvedAuth, cap: string) =>
      auth.capabilities.some((c) => c.id === cap),
    ),
  };
  const permissions = {
    resolveForUser: jest.fn().mockResolvedValue({ permissions: [] }),
  };
  Object.assign(service, { welfareResolver, permissions });
  return service;
}

describe('welfare HTTP access', () => {
  const choirId = '00000000-0000-0000-0000-000000000001';

  it('desk view via scoped capability', async () => {
    const welfareAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.welfare.view@choir' }],
    };
    const service = mockWelfareAccess(welfareAuth);
    await expect(
      service.canWelfareUi('u1', 'welfare-desk', [], choirId),
    ).resolves.toBe(true);
  });

  it('manage via legacy permission', async () => {
    const welfareAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockWelfareAccess(welfareAuth);
    await expect(
      service.canWelfareUi('u1', 'welfare-manage', ['choir.welfare.manage'], choirId),
    ).resolves.toBe(true);
  });
});
