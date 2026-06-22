import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  disciplineNavItemVisible,
  pageAccessForDisciplineRoute,
} from '../../../../web/lib/navigation/discipline-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const careOfficerAuth: ResolvedAuth = {
  userId: 'care',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.discipline.view@choir' },
    { id: 'choir.discipline.manage@choir' },
  ],
};

const secretaryAuth: ResolvedAuth = {
  userId: 'sec',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.discipline.view@choir' }],
};

const reviewerAuth: ResolvedAuth = {
  userId: 'rev',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.discipline.review@choir' }],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('discipline nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Care officer', auth: careOfficerAuth },
    { label: 'Secretary (view)', auth: secretaryAuth },
    { label: 'Reviewer only', auth: reviewerAuth },
    { label: 'Member (no caps)', auth: memberAuth },
  ]) {
    describe(persona.label, () => {
      it('discipline: nav visibility matches page access', () => {
        const path = routePath('discipline');
        expect(disciplineNavItemVisible(path, persona.auth)).toBe(
          pageAccessForDisciplineRoute(path, persona.auth),
        );
      });
    });
  }

  it('reviewer can view desk but not manage', () => {
    expect(pageAccessForDisciplineRoute(routePath('discipline'), reviewerAuth)).toBe(
      true,
    );
  });

  it('member without caps cannot access discipline desk', () => {
    expect(pageAccessForDisciplineRoute(routePath('discipline'), memberAuth)).toBe(
      false,
    );
  });
});
