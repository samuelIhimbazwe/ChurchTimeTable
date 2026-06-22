import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('logistics capability-can', () => {
  const logisticsAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.document.view@choir' },
      { id: 'choir.uniform.manage@choir' },
      { id: 'choir.equipment.view@choir' },
    ],
  };

  const noCapsAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [],
  };

  it('document view and uniform manage are granted', () => {
    expect(can(logisticsAuth, 'choir.document.view@choir')).toBe(true);
    expect(can(logisticsAuth, 'choir.uniform.manage@choir')).toBe(true);
    expect(can(logisticsAuth, 'choir.equipment.view@choir')).toBe(true);
    expect(can(logisticsAuth, 'choir.document.manage@choir')).toBe(false);
  });

  it('user without logistics caps cannot access', () => {
    expect(can(noCapsAuth, 'choir.document.view@choir')).toBe(false);
    expect(can(noCapsAuth, 'choir.uniform.manage@choir')).toBe(false);
  });
});
