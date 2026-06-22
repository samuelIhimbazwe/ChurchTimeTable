import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  rosterNavItemVisible,
  pageAccessForRosterRoute,
} from '../../../../web/lib/navigation/roster-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const secretaryAuth: ResolvedAuth = {
  userId: 'sec',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.member.view@choir' }],
};

const presidentAuth: ResolvedAuth = {
  userId: 'pres',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.member.view@choir' },
    { id: 'choir.member.manage@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(): string {
  return choirPath(PILOT_CHOIR, 'members');
}

describe('roster nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Secretary (view)', auth: secretaryAuth },
    { label: 'President', auth: presidentAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('roster: nav visibility matches page access', () => {
        const path = routePath();
        expect(rosterNavItemVisible(path, persona.auth)).toBe(
          pageAccessForRosterRoute(path, persona.auth),
        );
      });
    });
  }

  it('viewer with member.view can access roster', () => {
    expect(pageAccessForRosterRoute(routePath(), secretaryAuth)).toBe(true);
  });

  it('user without caps cannot access roster', () => {
    expect(pageAccessForRosterRoute(routePath(), noCapsAuth)).toBe(false);
  });
});
