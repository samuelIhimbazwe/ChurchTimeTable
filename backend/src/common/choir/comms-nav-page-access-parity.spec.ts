import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  commsNavItemVisible,
  pageAccessForCommsRoute,
} from '../../../../web/lib/navigation/comms-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const secretaryAuth: ResolvedAuth = {
  userId: 'sec',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.announcement.view@choir' },
    { id: 'choir.announcement.manage@choir' },
    { id: 'choir.meeting.view@choir' },
    { id: 'choir.meeting.manage@choir' },
  ],
};

const annOnlyAuth: ResolvedAuth = {
  userId: 'dir',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.announcement.view@choir' }],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

describe('comms nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Secretary', auth: secretaryAuth },
    { label: 'Announcements view', auth: annOnlyAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('announcements: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'announcements');
        expect(commsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForCommsRoute(path, persona.auth),
        );
      });

      it('meetings: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'meetings');
        expect(commsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForCommsRoute(path, persona.auth),
        );
      });
    });
  }

  it('secretary can access announcements and meetings', () => {
    expect(
      pageAccessForCommsRoute(choirPath(PILOT_CHOIR, 'announcements'), secretaryAuth),
    ).toBe(true);
    expect(
      pageAccessForCommsRoute(choirPath(PILOT_CHOIR, 'meetings'), secretaryAuth),
    ).toBe(true);
  });

  it('user without caps cannot access comms routes', () => {
    expect(
      pageAccessForCommsRoute(choirPath(PILOT_CHOIR, 'announcements'), noCapsAuth),
    ).toBe(false);
    expect(
      pageAccessForCommsRoute(choirPath(PILOT_CHOIR, 'meetings'), noCapsAuth),
    ).toBe(false);
  });
});
