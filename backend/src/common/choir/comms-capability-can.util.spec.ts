import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('comms capability-can', () => {
  const annAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.announcement.view@choir' },
      { id: 'choir.announcement.manage@choir' },
    ],
  };

  const mtgAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [{ id: 'choir.meeting.manage@choir' }],
  };

  it('announcement manage implies view checks', () => {
    expect(can(annAuth, 'choir.announcement.view@choir')).toBe(true);
    expect(can(annAuth, 'choir.announcement.manage@choir')).toBe(true);
    expect(can(annAuth, 'choir.meeting.view@choir')).toBe(false);
  });

  it('meeting manage satisfies meeting.manage@choir', () => {
    expect(can(mtgAuth, 'choir.meeting.manage@choir')).toBe(true);
    expect(can(mtgAuth, 'choir.meeting.view@choir')).toBe(false);
  });
});
