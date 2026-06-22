import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('roster capability-can', () => {
  const viewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.member.view@choir' }],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [{ id: 'choir.member.manage@choir' }],
  };

  it('view satisfies member.view@choir', () => {
    expect(can(viewAuth, 'choir.member.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.member.manage@choir')).toBe(false);
  });

  it('manage satisfies member.manage@choir', () => {
    expect(can(manageAuth, 'choir.member.manage@choir')).toBe(true);
  });
});
