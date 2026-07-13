import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  advisorHubNavItemVisible,
  legacyAdvisorHubLinkVisible,
  LEGACY_ADVISOR_HUB_PATH,
  pageAccessForAdvisorHubRoute,
} from '../../../../web/lib/navigation/advisor-hub-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const advisorOpsAuths = {
  opsAuth: {
    userId: 'adv',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.ops.view@choir' }],
  } satisfies ResolvedAuth,
};

const advisorDisciplineAuths = {
  disciplineAuth: {
    userId: 'adv',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.discipline.view@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  opsAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
  disciplineAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('advisor hub nav ↔ page access parity', () => {
  it('legacy and scoped advisor paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(advisorOpsAuths);
    expect(advisorHubNavItemVisible(LEGACY_ADVISOR_HUB_PATH, check)).toBe(
      pageAccessForAdvisorHubRoute(LEGACY_ADVISOR_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'advisor');
    expect(advisorHubNavItemVisible(scoped, check)).toBe(
      pageAccessForAdvisorHubRoute(scoped, check),
    );
  });

  it('advisor with ops view sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(advisorOpsAuths);
    expect(legacyAdvisorHubLinkVisible([], check)).toBe(true);
  });

  it('advisor with discipline view sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(advisorDisciplineAuths);
    expect(legacyAdvisorHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyAdvisorHubLinkVisible(['choir.reports.view'])).toBe(true);
    expect(legacyAdvisorHubLinkVisible(['discipline:read_all'])).toBe(true);
    expect(legacyAdvisorHubLinkVisible(['event:read'])).toBe(true);
    expect(legacyAdvisorHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser does not inject advisor hub from capabilities alone', () => {
    const check = buildCapabilityRouterFromAuths(advisorOpsAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(roleSection?.items.some((i) => i.path === LEGACY_ADVISOR_HUB_PATH) ?? false).toBe(false);
  });

  it('getChoirNavForUser omits advisor hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasAdvisorLink =
      roleSection?.items.some((i) => i.path === LEGACY_ADVISOR_HUB_PATH) ?? false;
    expect(hasAdvisorLink).toBe(false);
  });
});
