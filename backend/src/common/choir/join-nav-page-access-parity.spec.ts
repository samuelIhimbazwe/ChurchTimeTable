import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  joinNavItemVisible,
  pageAccessForJoinRoute,
} from '../../../../web/lib/navigation/join-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const presidentAuth: ResolvedAuth = {
  userId: 'pres',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.join.review@choir' },
    { id: 'choir.member.manage@choir' },
  ],
};

const vpAuth: ResolvedAuth = {
  userId: 'vp',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.join.review@choir' }],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('join nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'President', auth: presidentAuth },
    { label: 'VP (review)', auth: vpAuth },
    { label: 'Member (no caps)', auth: memberAuth },
  ]) {
    describe(persona.label, () => {
      it('join-requests: nav visibility matches page access', () => {
        const path = routePath('join-requests');
        expect(joinNavItemVisible(path, persona.auth)).toBe(
          pageAccessForJoinRoute(path, persona.auth),
        );
      });
    });
  }

  it('reviewer can access join-requests nav route', () => {
    expect(pageAccessForJoinRoute(routePath('join-requests'), vpAuth)).toBe(
      true,
    );
  });

  it('member without caps cannot access join-requests nav route', () => {
    expect(pageAccessForJoinRoute(routePath('join-requests'), memberAuth)).toBe(
      false,
    );
  });
});
