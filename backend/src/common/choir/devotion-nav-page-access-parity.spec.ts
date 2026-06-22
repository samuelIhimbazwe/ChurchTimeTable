import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  devotionNavItemVisible,
  pageAccessForDevotionRoute,
} from '../../../../web/lib/navigation/devotion-nav';

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
});
