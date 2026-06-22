import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('music capability-can', () => {
  const viewAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.music.view@choir' },
      { id: 'choir.rehearsal.view@choir' },
    ],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.music.manage@choir' },
      { id: 'choir.rehearsal.manage@choir' },
    ],
  };

  it('view caps satisfy music and rehearsal view', () => {
    expect(can(viewAuth, 'choir.music.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.rehearsal.view@choir')).toBe(true);
    expect(can(viewAuth, 'choir.music.manage@choir')).toBe(false);
  });

  it('manage caps satisfy music and rehearsal manage', () => {
    expect(can(manageAuth, 'choir.music.manage@choir')).toBe(true);
    expect(can(manageAuth, 'choir.rehearsal.manage@choir')).toBe(true);
  });
});
