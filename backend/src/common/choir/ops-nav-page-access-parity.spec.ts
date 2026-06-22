import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  opsNavItemVisible,
  pageAccessForOpsRoute,
} from '../../../../web/lib/navigation/ops-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const directorAuth: ResolvedAuth = {
  userId: 'dir',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.ops.view@choir' },
    { id: 'choir.ops.manage@choir' },
    { id: 'choir.ops.schedule@choir' },
  ],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.ops.view@choir' }],
};

const scheduleOnlyAuth: ResolvedAuth = {
  userId: 'sec',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.ops.view@choir' },
    { id: 'choir.ops.schedule@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('ops nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Director', auth: directorAuth },
    { label: 'Member (view)', auth: memberAuth },
    { label: 'Schedule only', auth: scheduleOnlyAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('scheduling: nav visibility matches page access', () => {
        const path = routePath('scheduling');
        expect(opsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForOpsRoute(path, persona.auth),
        );
      });

      it('service-preparation: nav visibility matches page access', () => {
        const path = routePath('service-preparation');
        expect(opsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForOpsRoute(path, persona.auth),
        );
      });

      it('activities: nav visibility matches page access', () => {
        const path = routePath('activities');
        expect(opsNavItemVisible(path, persona.auth)).toBe(
          pageAccessForOpsRoute(path, persona.auth),
        );
      });
    });
  }

  it('member with view can access scheduling and activities', () => {
    expect(pageAccessForOpsRoute(routePath('scheduling'), memberAuth)).toBe(
      true,
    );
    expect(pageAccessForOpsRoute(routePath('activities'), memberAuth)).toBe(
      true,
    );
  });

  it('user without caps cannot access ops routes', () => {
    expect(pageAccessForOpsRoute(routePath('scheduling'), noCapsAuth)).toBe(
      false,
    );
  });
});
