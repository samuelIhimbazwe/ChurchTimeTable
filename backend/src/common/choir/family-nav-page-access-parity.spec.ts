import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  familyNavItemVisibleWithCheck,
  legacyFamilyCoordinatorHubLinkVisible,
  LEGACY_FAMILY_COORDINATOR_HUB_PATH,
  legacyFamilyHeadHubLinkVisible,
  LEGACY_FAMILY_HEAD_HUB_PATH,
  pageAccessForFamilyRouteWithCheck,
} from '../../../../web/lib/navigation/family-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const coordinatorAuth = {
  contributionAuth: {
    userId: 'coord',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.contribution.oversight@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  contributionAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

const familyHeadAuths = {
  contributionAuth: {
    userId: 'head',
    choirId: PILOT_CHOIR,
    capabilities: [
      { id: 'choir.contribution.view@family', scopeId: 'fam-a' },
      { id: 'choir.contribution.approve@family', scopeId: 'fam-a' },
    ],
  } satisfies ResolvedAuth,
};

describe('family coordinator hub nav ↔ page access parity', () => {
  it('legacy and scoped family coordinator paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(coordinatorAuth);
    expect(
      familyNavItemVisibleWithCheck(LEGACY_FAMILY_COORDINATOR_HUB_PATH, check),
    ).toBe(
      pageAccessForFamilyRouteWithCheck(LEGACY_FAMILY_COORDINATOR_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'family-coordinator');
    expect(familyNavItemVisibleWithCheck(scoped, check)).toBe(
      pageAccessForFamilyRouteWithCheck(scoped, check),
    );
  });

  it('family coordinator sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(coordinatorAuth);
    expect(legacyFamilyCoordinatorHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyFamilyCoordinatorHubLinkVisible(['choir.family.manage'])).toBe(
      true,
    );
    expect(legacyFamilyCoordinatorHubLinkVisible(['family:manage'])).toBe(true);
    expect(legacyFamilyCoordinatorHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser does not inject family coordinator hub from capabilities alone', () => {
    const check = buildCapabilityRouterFromAuths(coordinatorAuth);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_FAMILY_COORDINATOR_HUB_PATH) ?? false,
    ).toBe(false);
  });

  it('getChoirNavForUser omits family coordinator hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasCoordinatorLink =
      roleSection?.items.some((i) => i.path === LEGACY_FAMILY_COORDINATOR_HUB_PATH)
      ?? false;
    expect(hasCoordinatorLink).toBe(false);
  });
});

describe('family head hub nav ↔ page access parity', () => {
  it('legacy and scoped family head paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(familyHeadAuths);
    expect(familyNavItemVisibleWithCheck(LEGACY_FAMILY_HEAD_HUB_PATH, check)).toBe(
      pageAccessForFamilyRouteWithCheck(LEGACY_FAMILY_HEAD_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'family-head');
    expect(familyNavItemVisibleWithCheck(scoped, check)).toBe(
      pageAccessForFamilyRouteWithCheck(scoped, check),
    );
  });

  it('family head sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(familyHeadAuths);
    expect(legacyFamilyHeadHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(
      legacyFamilyHeadHubLinkVisible(['choir.contribution.view.family']),
    ).toBe(true);
    expect(
      legacyFamilyHeadHubLinkVisible(['choir.contribution.approve.family']),
    ).toBe(true);
    expect(legacyFamilyHeadHubLinkVisible(['choir.family.view'])).toBe(false);
    expect(legacyFamilyHeadHubLinkVisible(['family:view'])).toBe(false);
    expect(legacyFamilyHeadHubLinkVisible(['attendance.mark'])).toBe(false);
    expect(legacyFamilyHeadHubLinkVisible([])).toBe(false);
  });

  it('choir-wide member/ops caps do not open family head hub', () => {
    const presidentLike = {
      contributionAuth: {
        userId: 'pres',
        choirId: PILOT_CHOIR,
        capabilities: [
          { id: 'choir.contribution.view@choir' },
          { id: 'choir.contribution.view@family' },
        ],
      } satisfies ResolvedAuth,
    };
    const check = buildCapabilityRouterFromAuths(presidentLike);
    expect(legacyFamilyHeadHubLinkVisible([], check, presidentLike.contributionAuth)).toBe(
      false,
    );
    expect(
      familyNavItemVisibleWithCheck(
        choirPath(PILOT_CHOIR, 'family-leadership'),
        check,
        presidentLike.contributionAuth,
      ),
    ).toBe(false);
  });

  it('scoped family office grant opens family leadership routes', () => {
    const check = buildCapabilityRouterFromAuths(familyHeadAuths);
    expect(
      familyNavItemVisibleWithCheck(
        choirPath(PILOT_CHOIR, 'family-leadership'),
        check,
        familyHeadAuths.contributionAuth,
      ),
    ).toBe(true);
  });

  it('getChoirNavForUser does not inject family head from choir-wide permissions', () => {
    const check = buildCapabilityRouterFromAuths(familyHeadAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      ['choir.contribution.view.family'],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_FAMILY_HEAD_HUB_PATH) ?? false,
    ).toBe(false);
  });

  it('getChoirNavForUser omits family head hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasHeadLink =
      roleSection?.items.some((i) => i.path === LEGACY_FAMILY_HEAD_HUB_PATH) ?? false;
    expect(hasHeadLink).toBe(false);
  });
});
