import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  legacyVicePresidentHubLinkVisible,
  LEGACY_VICE_PRESIDENT_HUB_PATH,
  pageAccessForVicePresidentHubRoute,
  vicePresidentHubNavItemVisible,
} from '../../../../web/lib/navigation/vice-president-hub-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const vpAuths = {
  opsAuth: {
    userId: 'vp',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.ops.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  opsAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('vice president hub nav ↔ page access parity', () => {
  it('legacy and scoped vice president paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(vpAuths);
    expect(vicePresidentHubNavItemVisible(LEGACY_VICE_PRESIDENT_HUB_PATH, check)).toBe(
      pageAccessForVicePresidentHubRoute(LEGACY_VICE_PRESIDENT_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'vice-president');
    expect(vicePresidentHubNavItemVisible(scoped, check)).toBe(
      pageAccessForVicePresidentHubRoute(scoped, check),
    );
  });

  it('vice president sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(vpAuths);
    expect(legacyVicePresidentHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyVicePresidentHubLinkVisible(['choir.ops.view'])).toBe(true);
    expect(legacyVicePresidentHubLinkVisible(['choir.ops.manage'])).toBe(true);
    expect(legacyVicePresidentHubLinkVisible(['event:write'])).toBe(true);
    expect(legacyVicePresidentHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser does not inject vice president hub from capabilities alone', () => {
    const check = buildCapabilityRouterFromAuths(vpAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_VICE_PRESIDENT_HUB_PATH) ?? false,
    ).toBe(false);
  });

  it('getChoirNavForUser omits vice president hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasVpLink =
      roleSection?.items.some((i) => i.path === LEGACY_VICE_PRESIDENT_HUB_PATH) ?? false;
    expect(hasVpLink).toBe(false);
  });
});
