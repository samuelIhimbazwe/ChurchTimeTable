import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('welfare capability-can', () => {
  const viewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.welfare.view@choir' }],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.welfare.view@choir' },
      { id: 'choir.welfare.manage@choir' },
    ],
  };

  it('view satisfies view@choir', () => {
    expect(can(viewAuth, 'choir.welfare.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.welfare.manage@choir')).toBe(false);
  });

  it('manage satisfies manage@choir', () => {
    expect(can(manageAuth, 'choir.welfare.manage@choir')).toBe(true);
  });
});
