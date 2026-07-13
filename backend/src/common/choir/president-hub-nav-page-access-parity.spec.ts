import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  legacyPresidentHubLinkVisible,
  LEGACY_PRESIDENT_HUB_PATH,
  pageAccessForPresidentHubRoute,
  presidentHubNavItemVisible,
} from '../../../../web/lib/navigation/president-hub-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const presidentAuths = {
  joinAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.member.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  joinAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
  opsAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('president hub nav ↔ page access parity', () => {
  it('legacy and scoped president paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(presidentAuths);
    expect(presidentHubNavItemVisible(LEGACY_PRESIDENT_HUB_PATH, check)).toBe(
      pageAccessForPresidentHubRoute(LEGACY_PRESIDENT_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'president');
    expect(presidentHubNavItemVisible(scoped, check)).toBe(
      pageAccessForPresidentHubRoute(scoped, check),
    );
  });

  it('president sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(presidentAuths);
    expect(legacyPresidentHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyPresidentHubLinkVisible(['member:manage'])).toBe(true);
    expect(legacyPresidentHubLinkVisible(['choir.oversight'])).toBe(true);
    expect(legacyPresidentHubLinkVisible(['choir.operations.manage'])).toBe(true);
    expect(legacyPresidentHubLinkVisible(['choir.join.review'])).toBe(false);
    expect(legacyPresidentHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser does not inject president hub from capabilities alone', () => {
    const check = buildCapabilityRouterFromAuths(presidentAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_PRESIDENT_HUB_PATH) ?? false,
    ).toBe(false);
  });

  it('getChoirNavForUser omits president hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasPresidentLink =
      roleSection?.items.some((i) => i.path === LEGACY_PRESIDENT_HUB_PATH) ?? false;
    expect(hasPresidentLink).toBe(false);
  });
});
