import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  logisticsNavItemVisible,
  pageAccessForLogisticsRoute,
} from '../../../../web/lib/navigation/logistics-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const logisticsAuth: ResolvedAuth = {
  userId: 'log',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.document.view@choir' },
    { id: 'choir.uniform.manage@choir' },
    { id: 'choir.equipment.view@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

describe('logistics nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Logistics officer', auth: logisticsAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('documents: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'documents');
        expect(logisticsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForLogisticsRoute(path, persona.auth),
        );
      });

      it('assets: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'assets');
        expect(logisticsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForLogisticsRoute(path, persona.auth),
        );
      });
    });
  }

  it('logistics officer can access documents and assets', () => {
    expect(
      pageAccessForLogisticsRoute(choirPath(PILOT_CHOIR, 'documents'), logisticsAuth),
    ).toBe(true);
    expect(
      pageAccessForLogisticsRoute(choirPath(PILOT_CHOIR, 'assets'), logisticsAuth),
    ).toBe(true);
  });

  it('user without caps cannot access logistics routes', () => {
    expect(
      pageAccessForLogisticsRoute(choirPath(PILOT_CHOIR, 'documents'), noCapsAuth),
    ).toBe(false);
    expect(
      pageAccessForLogisticsRoute(choirPath(PILOT_CHOIR, 'assets'), noCapsAuth),
    ).toBe(false);
  });
});
