import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('join capability-can', () => {
  const reviewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.join.review@choir' }],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.join.review@choir' },
      { id: 'choir.member.manage@choir' },
    ],
  };

  it('review satisfies review@choir', () => {
    expect(can(reviewAuth, 'choir.join.review@choir')).toBe(true);
    expect(can(reviewAuth, 'choir.member.manage@choir')).toBe(false);
  });

  it('manage satisfies member.manage@choir', () => {
    expect(can(manageAuth, 'choir.member.manage@choir')).toBe(true);
  });
});
