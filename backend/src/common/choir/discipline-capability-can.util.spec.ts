import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('discipline capability-can', () => {
  const viewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.discipline.view@choir' }],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.discipline.view@choir' },
      { id: 'choir.discipline.manage@choir' },
    ],
  };

  it('view satisfies view@choir', () => {
    expect(can(viewAuth, 'choir.discipline.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.discipline.manage@choir')).toBe(false);
  });

  it('manage satisfies manage@choir', () => {
    expect(can(manageAuth, 'choir.discipline.manage@choir')).toBe(true);
  });
});
