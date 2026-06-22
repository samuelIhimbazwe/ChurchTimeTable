import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  rolesNavItemVisible,
  pageAccessForRolesRoute,
} from '../../../../web/lib/navigation/roles-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const rolesAuth: ResolvedAuth = {
  userId: 'pres',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.custom_role.manage@choir' },
    { id: 'choir.committee_role.manage@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

describe('roles nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'President', auth: rolesAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('roles: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'roles');
        expect(rolesNavItemVisible(path, persona.auth)).toBe(
          pageAccessForRolesRoute(path, persona.auth),
        );
      });
    });
  }

  it('president can access roles route', () => {
    expect(
      pageAccessForRolesRoute(choirPath(PILOT_CHOIR, 'roles'), rolesAuth),
    ).toBe(true);
  });

  it('user without caps cannot access roles route', () => {
    expect(
      pageAccessForRolesRoute(choirPath(PILOT_CHOIR, 'roles'), noCapsAuth),
    ).toBe(false);
  });
});
