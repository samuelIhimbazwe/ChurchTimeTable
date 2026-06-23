import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';
import { uiCapabilityVisible } from './devotion-ui-capability-registry';

describe('spiritual devotion UI capabilities', () => {
  const intercessionLegacyAuth: ResolvedAuth = {
    userId: 'spirit',
    choirId: 'c1',
    capabilities: [],
  };

  const manageAuth: ResolvedAuth = {
    userId: 'spirit',
    choirId: 'c1',
    capabilities: [{ id: 'choir.devotion.manage@choir' }],
  };

  const publishAuth: ResolvedAuth = {
    userId: 'spirit',
    choirId: 'c1',
    capabilities: [{ id: 'choir.devotion.publish@choir' }],
  };

  it('aliases intercession and spiritual program legacy permissions', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.intercession.manage']).toEqual([
      'choir.devotion.manage@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['choir.spiritual.program.manage']).toEqual(
      expect.arrayContaining([
        'choir.devotion.publish@choir',
        'choir.devotion.manage@choir',
      ]),
    );
  });

  it('manage cap unlocks intercession actions', () => {
    const check = (capId: string) => can(manageAuth, capId);
    expect(uiCapabilityVisible('devotion-intercession-actions', check)).toBe(true);
  });

  it('publish cap unlocks prayer programs', () => {
    const check = (capId: string) => can(publishAuth, capId);
    expect(uiCapabilityVisible('devotion-prayer-programs', check)).toBe(true);
    expect(uiCapabilityVisible('devotion-intercession-actions', check)).toBe(false);
  });

  it('user without caps cannot manage intercession or programs', () => {
    const check = (capId: string) => can(intercessionLegacyAuth, capId);
    expect(uiCapabilityVisible('devotion-intercession-actions', check)).toBe(false);
    expect(uiCapabilityVisible('devotion-prayer-programs', check)).toBe(false);
  });
});
