import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  pageAccessForWelfareRoute,
  welfareNavItemVisible,
} from '../../../../web/lib/navigation/welfare-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const WELFARE_ROUTES = ['welfare', 'care/desk'] as const;

const careOfficerAuth: ResolvedAuth = {
  userId: 'care',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.welfare.view@choir' },
    { id: 'choir.welfare.manage@choir' },
  ],
};

const memberViewAuth: ResolvedAuth = {
  userId: 'member',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.welfare.view@choir' }],
};

const secretaryAuth: ResolvedAuth = {
  userId: 'sec',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('welfare nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Care officer', auth: careOfficerAuth },
    { label: 'Member (view only)', auth: memberViewAuth },
    { label: 'Secretary (no welfare)', auth: secretaryAuth },
  ]) {
    describe(persona.label, () => {
      for (const tail of WELFARE_ROUTES) {
        const path = routePath(tail);
        it(`${tail}: nav visibility matches page access`, () => {
          expect(welfareNavItemVisible(path, persona.auth)).toBe(
            pageAccessForWelfareRoute(path, persona.auth),
          );
        });
      }
    });
  }

  it('care officer sees desk and welfare; member view-only sees both read routes', () => {
    expect(pageAccessForWelfareRoute(routePath('welfare'), careOfficerAuth)).toBe(true);
    expect(pageAccessForWelfareRoute(routePath('care/desk'), careOfficerAuth)).toBe(true);
    expect(pageAccessForWelfareRoute(routePath('welfare'), memberViewAuth)).toBe(true);
    expect(pageAccessForWelfareRoute(routePath('care/desk'), memberViewAuth)).toBe(true);
  });

  it('secretary without welfare caps cannot access welfare routes', () => {
    expect(pageAccessForWelfareRoute(routePath('welfare'), secretaryAuth)).toBe(false);
    expect(pageAccessForWelfareRoute(routePath('care/desk'), secretaryAuth)).toBe(false);
  });
});
