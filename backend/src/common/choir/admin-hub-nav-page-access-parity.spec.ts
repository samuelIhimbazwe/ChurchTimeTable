import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { can } from '../../../../web/lib/choir/capability-can';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  adminHubNavItemVisible,
  pageAccessForAdminHubRoute,
} from '../../../../web/lib/navigation/admin-hub-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const presidentAuth: ResolvedAuth = {
  userId: 'pres',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.join.review@choir' },
    { id: 'choir.member.manage@choir' },
    { id: 'choir.ops.manage@choir' },
  ],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function check(auth: ResolvedAuth | undefined) {
  return (capId: string) => (auth ? can(auth, capId) : false);
}

describe('admin hub nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'President', auth: presidentAuth },
    { label: 'Member (no caps)', auth: memberAuth },
  ]) {
    describe(persona.label, () => {
      it('admin: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'admin');
        expect(adminHubNavItemVisible(path, persona.auth, check(persona.auth))).toBe(
          pageAccessForAdminHubRoute(path, persona.auth, check(persona.auth)),
        );
      });
    });
  }

  it('president can access admin route', () => {
    const path = choirPath(PILOT_CHOIR, 'admin');
    expect(pageAccessForAdminHubRoute(path, presidentAuth, check(presidentAuth))).toBe(
      true,
    );
  });

  it('member without caps cannot access admin route', () => {
    const path = choirPath(PILOT_CHOIR, 'admin');
    expect(pageAccessForAdminHubRoute(path, memberAuth, check(memberAuth))).toBe(
      false,
    );
  });
});
