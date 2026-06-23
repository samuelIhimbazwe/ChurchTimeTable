import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';
import { uiCapabilityVisible } from './ops-ui-capability-registry';

describe('ops activities create UI capability', () => {
  const manageAuth: ResolvedAuth = {
    userId: 'dir',
    choirId: 'c1',
    capabilities: [{ id: 'choir.ops.manage@choir' }],
  };

  const viewAuth: ResolvedAuth = {
    userId: 'mem',
    choirId: 'c1',
    capabilities: [{ id: 'choir.ops.view@choir' }],
  };

  it('maps legacy event permissions to ops manage', () => {
    expect(LEGACY_PERMISSION_ALIASES['event:write']).toEqual([
      'choir.ops.manage@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['choir.events.manage']).toEqual(
      expect.arrayContaining(['choir.ops.manage@choir']),
    );
  });

  it('ops manage satisfies activities create gate', () => {
    const check = (capId: string) => can(manageAuth, capId);
    expect(uiCapabilityVisible('ops-activities-manage', check)).toBe(true);
  });

  it('view-only ops cannot create activities', () => {
    const check = (capId: string) => can(viewAuth, capId);
    expect(uiCapabilityVisible('ops-activities-hub', check)).toBe(true);
    expect(uiCapabilityVisible('ops-activities-manage', check)).toBe(false);
  });
});
