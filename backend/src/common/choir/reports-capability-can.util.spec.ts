import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('reports capability-can', () => {
  const exportAuth: ResolvedAuth = {
    userId: 'sec',
    choirId: 'c1',
    capabilities: [{ id: 'choir.report.export@choir' }],
  };

  const viewAuth: ResolvedAuth = {
    userId: 'vp',
    choirId: 'c1',
    capabilities: [{ id: 'choir.ops.view@choir' }],
  };

  it('export capability is distinct from ops.view', () => {
    expect(can(exportAuth, 'choir.report.export@choir')).toBe(true);
    expect(can(exportAuth, 'choir.ops.view@choir')).toBe(false);
  });

  it('ops.view satisfies export UI fallback cap', () => {
    expect(can(viewAuth, 'choir.ops.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.report.export@choir')).toBe(false);
  });
});
