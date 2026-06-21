import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  contributionNavItemVisible,
  pageAccessForContributionRoute,
} from '../../../../web/lib/navigation/contribution-nav';

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
});
