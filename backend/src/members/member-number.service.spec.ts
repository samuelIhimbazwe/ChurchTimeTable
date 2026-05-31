import { MemberNumberService } from './member-number.service';

describe('MemberNumberService', () => {
  const service = new MemberNumberService({} as never);

  it('formats member numbers with zero padding', () => {
    expect(service.formatMemberNumber(1)).toBe('M000001');
    expect(service.formatMemberNumber(42)).toBe('M000042');
    expect(service.formatMemberNumber(120)).toBe('M000120');
  });

  it('generates sequential numbers atomically', async () => {
    let nextValue = 1;
    const tx = {
      memberNumberSequence: {
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockImplementation(async () => {
          nextValue += 1;
          return { nextValue };
        }),
      },
    };

    const first = await service.generateMemberNumber(tx as never);
    const second = await service.generateMemberNumber(tx as never);
    const third = await service.generateMemberNumber(tx as never);

    expect(first).toBe('M000001');
    expect(second).toBe('M000002');
    expect(third).toBe('M000003');
    expect(new Set([first, second, third]).size).toBe(3);
  });
});
