import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import { pageAccessForSponsorRoute } from '../../../../web/lib/navigation/sponsor-nav';
import { pageAccessForJoinRoute } from '../../../../web/lib/navigation/join-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const treasurerAuth: ResolvedAuth = {
  userId: 'treas',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.sponsor.review@choir' }],
};

const presidentAuth: ResolvedAuth = {
  userId: 'pres',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.sponsor.review@choir' },
    { id: 'choir.member.manage@choir' },
  ],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(): string {
  return choirPath(PILOT_CHOIR, 'join-requests');
}

describe('sponsor nav ↔ page access parity', () => {
  it('treasurer sponsor desk matches sponsor route access', () => {
    const path = routePath();
    expect(pageAccessForSponsorRoute(path, treasurerAuth)).toBe(true);
  });

  it('sponsor-only reviewer can access join-requests via sponsor desk', () => {
    const path = routePath();
    expect(pageAccessForJoinRoute(path, treasurerAuth)).toBe(false);
    expect(pageAccessForSponsorRoute(path, treasurerAuth)).toBe(true);
  });

  it('member without caps cannot access sponsor desk route', () => {
    expect(pageAccessForSponsorRoute(routePath(), memberAuth)).toBe(false);
  });

  it('president with manage can access sponsor desk', () => {
    expect(pageAccessForSponsorRoute(routePath(), presidentAuth)).toBe(true);
  });
});
