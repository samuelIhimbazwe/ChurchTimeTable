import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';

describe('ContributionEffectiveAmountService', () => {
  const service = new ContributionEffectiveAmountService();

  it('sums confirmed amount and adjustments', () => {
    expect(
      service.compute(10000, [
        { adjustmentAmount: -3000 },
        { adjustmentAmount: 500 },
      ]),
    ).toBe(7500);
  });

  it('aggregates rows', () => {
    const total = service.sumRows([
      {
        id: '1',
        memberId: 'm1',
        familyId: 'f1',
        contributionTypeCatalogId: null,
        contributionCampaignId: null,
        confirmedAmount: 10000,
        amount: 10000,
        adjustments: [{ adjustmentAmount: -3000 }],
      },
      {
        id: '2',
        memberId: 'm2',
        familyId: 'f1',
        contributionTypeCatalogId: null,
        contributionCampaignId: null,
        confirmedAmount: 5000,
        amount: 5000,
        adjustments: [],
      },
    ]);
    expect(total).toBe(12000);
  });
});
