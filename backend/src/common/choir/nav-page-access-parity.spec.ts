import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  contributionNavItemVisible,
  contributionNavItemVisibleWithCheck,
  legacyBudgetHubLinkVisible,
  LEGACY_BUDGET_HUB_PATH,
  pageAccessForContributionRoute,
  pageAccessForContributionRouteWithCheck,
} from '../../../../web/lib/navigation/contribution-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const CONTRIBUTION_ROUTES = [
  'stewardship',
  'stewardship/admin',
  'finance',
  'budget',
  'budget/verify',
  'membership/giving',
  'family-leadership/contributions',
] as const;

const treasurerAuth: ResolvedAuth = {
  userId: 'treasurer',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.contribution.verify@choir' },
    { id: 'choir.contribution.view@choir' },
    { id: 'choir.contribution.catalog.manage@choir' },
    { id: 'choir.budget.view@choir' },
    { id: 'choir.budget.manage@choir' },
  ],
};

const familyHeadFamA: ResolvedAuth = {
  userId: 'head-a',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.contribution.approve@family', scopeId: 'fam-a' },
    { id: 'choir.contribution.view@family', scopeId: 'fam-a' },
    { id: 'choir.contribution.submit@self' },
    { id: 'choir.contribution.view@self' },
  ],
};

const familyCoordinatorAuth: ResolvedAuth = {
  userId: 'coord',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.contribution.oversight@choir' },
    { id: 'choir.contribution.view@choir' },
  ],
};

type Persona = {
  label: string;
  auth: ResolvedAuth;
};

const PERSONAS: Persona[] = [
  { label: 'Treasurer', auth: treasurerAuth },
  { label: 'Family Head (family A)', auth: familyHeadFamA },
  { label: 'Family Coordinator (oversight@choir only)', auth: familyCoordinatorAuth },
];

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('contribution nav ↔ page access parity', () => {
  for (const persona of PERSONAS) {
    describe(persona.label, () => {
      for (const tail of CONTRIBUTION_ROUTES) {
        const path = routePath(tail);
        it(`${tail}: nav visibility matches page access`, () => {
          const navVisible = contributionNavItemVisible(path, persona.auth);
          const pageVisible = pageAccessForContributionRoute(path, persona.auth);
          expect(navVisible).toBe(pageVisible);
        });
      }
    });
  }

  it('Treasurer sees treasury routes but not family B family inbox', () => {
    expect(pageAccessForContributionRoute(routePath('stewardship'), treasurerAuth)).toBe(true);
    expect(pageAccessForContributionRoute(routePath('budget/verify'), treasurerAuth)).toBe(true);
    expect(
      pageAccessForContributionRoute(routePath('family-leadership/contributions'), treasurerAuth),
    ).toBe(false);
  });

  it('Family Head A sees family contributions and giving, not treasury verify', () => {
    expect(
      pageAccessForContributionRoute(routePath('family-leadership/contributions'), familyHeadFamA),
    ).toBe(true);
    expect(pageAccessForContributionRoute(routePath('membership/giving'), familyHeadFamA)).toBe(
      true,
    );
    expect(pageAccessForContributionRoute(routePath('budget/verify'), familyHeadFamA)).toBe(false);
  });

  it('Family Coordinator sees stewardship/finance but not family inbox or verify', () => {
    expect(
      pageAccessForContributionRoute(routePath('stewardship'), familyCoordinatorAuth),
    ).toBe(true);
    expect(pageAccessForContributionRoute(routePath('finance'), familyCoordinatorAuth)).toBe(true);
    expect(
      pageAccessForContributionRoute(routePath('family-leadership/contributions'), familyCoordinatorAuth),
    ).toBe(false);
    expect(pageAccessForContributionRoute(routePath('budget/verify'), familyCoordinatorAuth)).toBe(
      false,
    );
  });

  it('legacy and scoped budget paths use same gate via capability router', () => {
    const auths = { contributionAuth: treasurerAuth };
    const check = buildCapabilityRouterFromAuths(auths);
    expect(contributionNavItemVisibleWithCheck(LEGACY_BUDGET_HUB_PATH, check)).toBe(
      pageAccessForContributionRouteWithCheck(LEGACY_BUDGET_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'budget');
    expect(contributionNavItemVisibleWithCheck(scoped, check)).toBe(
      pageAccessForContributionRouteWithCheck(scoped, check),
    );
  });

  it('treasurer sees legacy budget hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths({ contributionAuth: treasurerAuth });
    expect(legacyBudgetHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyBudgetHubLinkVisible(['choir.finance.view'])).toBe(true);
    expect(legacyBudgetHubLinkVisible(['choir.finance.manage'])).toBe(true);
    expect(legacyBudgetHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser includes budget hub when capability router grants access', () => {
    const check = buildCapabilityRouterFromAuths({ contributionAuth: treasurerAuth });
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(roleSection?.items.some((i) => i.path === LEGACY_BUDGET_HUB_PATH)).toBe(true);
  });

  it('getChoirNavForUser omits budget hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths({
      contributionAuth: {
        userId: 'mem',
        choirId: PILOT_CHOIR,
        capabilities: [],
      },
    });
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasBudgetLink =
      roleSection?.items.some((i) => i.path === LEGACY_BUDGET_HUB_PATH) ?? false;
    expect(hasBudgetLink).toBe(false);
  });
});
