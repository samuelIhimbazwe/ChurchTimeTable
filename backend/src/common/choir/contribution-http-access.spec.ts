import { ContributionHttpAccessService } from './contribution-http-access.service';
import type { ResolvedAuth } from './capability.types';

function mockContributionAccess(contributionAuth: ResolvedAuth) {
  const service = Object.create(
    ContributionHttpAccessService.prototype,
  ) as ContributionHttpAccessService;
  const contributionResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(contributionAuth),
    can: jest.fn((auth: ResolvedAuth, cap: string) =>
      auth.capabilities.some((c) => c.id === cap),
    ),
  };
  const permissions = {
    resolveForUser: jest.fn().mockResolvedValue({ permissions: [] }),
  };
  Object.assign(service, { contributionResolver, permissions });
  return service;
}

describe('contribution HTTP access', () => {
  const choirId = '00000000-0000-0000-0000-000000000001';

  it('submit via scoped self capability', async () => {
    const contributionAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.contribution.submit@self' }],
    };
    const service = mockContributionAccess(contributionAuth);
    await expect(
      service.canContributionUi('u1', 'contribution-submit', [], choirId),
    ).resolves.toBe(true);
  });

  it('finance view via legacy permission', async () => {
    const contributionAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockContributionAccess(contributionAuth);
    await expect(
      service.canContributionUi(
        'u1',
        'contribution-finance-view',
        ['choir.finance.view'],
        choirId,
      ),
    ).resolves.toBe(true);
  });
});
