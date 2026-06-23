import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  devotionNavItemVisible,
  devotionNavItemVisibleWithCheck,
  legacySpiritualHubLinkVisible,
  LEGACY_SPIRITUAL_HUB_PATH,
  pageAccessForDevotionRoute,
  pageAccessForDevotionRouteWithCheck,
} from '../../../../web/lib/navigation/devotion-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const devotionAuth: ResolvedAuth = {
  userId: 'spirit',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.devotion.view@choir' },
    { id: 'choir.devotion.publish@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

const devotionOfficerAuths = {
  devotionAuth: {
    userId: 'spirit-officer',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.devotion.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  devotionAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('devotion nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Devotion publish', auth: devotionAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('spiritual: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'spiritual');
        expect(devotionNavItemVisible(path, persona.auth)).toBe(
          pageAccessForDevotionRoute(path, persona.auth),
        );
      });
    });
  }

  it('user with devotion view can access spiritual devotion route check', () => {
    expect(
      pageAccessForDevotionRoute(choirPath(PILOT_CHOIR, 'spiritual'), devotionAuth),
    ).toBe(true);
  });

  it('user without caps fails devotion route check', () => {
    expect(
      pageAccessForDevotionRoute(choirPath(PILOT_CHOIR, 'spiritual'), noCapsAuth),
    ).toBe(false);
  });

  it('legacy and scoped spiritual paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(devotionOfficerAuths);
    expect(devotionNavItemVisibleWithCheck(LEGACY_SPIRITUAL_HUB_PATH, check)).toBe(
      pageAccessForDevotionRouteWithCheck(LEGACY_SPIRITUAL_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'spiritual');
    expect(devotionNavItemVisibleWithCheck(scoped, check)).toBe(
      pageAccessForDevotionRouteWithCheck(scoped, check),
    );
  });

  it('devotion officer sees legacy spiritual hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(devotionOfficerAuths);
    expect(legacySpiritualHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacySpiritualHubLinkVisible(['choir.devotion.manage'])).toBe(true);
    expect(legacySpiritualHubLinkVisible(['choir.intercession.manage'])).toBe(true);
    expect(legacySpiritualHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser includes spiritual hub when capability router grants access', () => {
    const check = buildCapabilityRouterFromAuths(devotionOfficerAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_SPIRITUAL_HUB_PATH),
    ).toBe(true);
  });

  it('getChoirNavForUser omits spiritual hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasSpiritualLink =
      roleSection?.items.some((i) => i.path === LEGACY_SPIRITUAL_HUB_PATH) ?? false;
    expect(hasSpiritualLink).toBe(false);
  });
});
