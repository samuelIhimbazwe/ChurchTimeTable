import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  careHubNavItemVisible,
  legacyCareHubLinkVisible,
  LEGACY_CARE_HUB_PATH,
  pageAccessForCareHubRoute,
} from '../../../../web/lib/navigation/care-hub-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const welfareOfficerAuths = {
  welfareAuth: {
    userId: 'care',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.welfare.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  welfareAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('care hub nav ↔ page access parity', () => {
  it('legacy and scoped care paths use same gate', () => {
    const check = buildCapabilityRouterFromAuths(welfareOfficerAuths);
    expect(careHubNavItemVisible(LEGACY_CARE_HUB_PATH, check)).toBe(
      pageAccessForCareHubRoute(LEGACY_CARE_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'care');
    expect(careHubNavItemVisible(scoped, check)).toBe(
      pageAccessForCareHubRoute(scoped, check),
    );
  });

  it('welfare officer sees legacy care hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(welfareOfficerAuths);
    expect(legacyCareHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyCareHubLinkVisible(['choir.welfare.manage'])).toBe(true);
    expect(legacyCareHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser includes care hub when capability router grants access', () => {
    const check = buildCapabilityRouterFromAuths(welfareOfficerAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(roleSection?.items.some((i) => i.path === LEGACY_CARE_HUB_PATH)).toBe(
      true,
    );
  });

  it('getChoirNavForUser omits care hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasCareLink =
      roleSection?.items.some((i) => i.path === LEGACY_CARE_HUB_PATH) ?? false;
    expect(hasCareLink).toBe(false);
  });
});
