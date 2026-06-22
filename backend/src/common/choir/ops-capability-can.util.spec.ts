import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('ops capability-can', () => {
  const viewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.ops.view@choir' }],
  };

  const scheduleAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.ops.view@choir' },
      { id: 'choir.ops.schedule@choir' },
    ],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u3',
    choirId: 'c1',
    capabilities: [{ id: 'choir.ops.manage@choir' }],
  };

  it('view satisfies view@choir', () => {
    expect(can(viewAuth, 'choir.ops.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.ops.manage@choir')).toBe(false);
  });

  it('schedule satisfies schedule@choir', () => {
    expect(can(scheduleAuth, 'choir.ops.schedule@choir')).toBe(true);
  });

  it('manage satisfies manage@choir', () => {
    expect(can(manageAuth, 'choir.ops.manage@choir')).toBe(true);
  });
});
