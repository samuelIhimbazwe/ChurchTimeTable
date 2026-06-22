import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('devotion capability-can', () => {
  const devotionAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.devotion.view@choir' },
      { id: 'choir.devotion.publish@choir' },
    ],
  };

  const noCapsAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [],
  };

  it('devotion view and publish are granted', () => {
    expect(can(devotionAuth, 'choir.devotion.view@choir')).toBe(true);
    expect(can(devotionAuth, 'choir.devotion.publish@choir')).toBe(true);
    expect(can(devotionAuth, 'choir.devotion.manage@choir')).toBe(false);
  });

  it('user without devotion caps cannot access', () => {
    expect(can(noCapsAuth, 'choir.devotion.view@choir')).toBe(false);
  });
});
