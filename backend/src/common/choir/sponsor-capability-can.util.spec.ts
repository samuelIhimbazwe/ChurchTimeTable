import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('sponsor capability-can', () => {
  const reviewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.sponsor.review@choir' }],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [{ id: 'choir.member.manage@choir' }],
  };

  it('review satisfies sponsor.review@choir', () => {
    expect(can(reviewAuth, 'choir.sponsor.review@choir')).toBe(true);
    expect(can(reviewAuth, 'choir.member.manage@choir')).toBe(false);
  });

  it('manage satisfies member.manage@choir', () => {
    expect(can(manageAuth, 'choir.member.manage@choir')).toBe(true);
  });
});
