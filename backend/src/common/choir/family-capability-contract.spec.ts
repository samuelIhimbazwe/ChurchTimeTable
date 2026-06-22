import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { CONTRIBUTION_UI_CAPABILITY_REGISTRY } from './contribution-ui-capability-registry';

describe('family UI capability contract', () => {
  it('aliases family manage permissions to oversight@choir', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.family.manage']).toEqual([
      'choir.contribution.oversight@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['family:manage']).toEqual([
      'choir.contribution.oversight@choir',
    ]);
  });

  it('defines family-manage and family-hub UI capabilities', () => {
    const manage = CONTRIBUTION_UI_CAPABILITY_REGISTRY.find(
      (d) => d.id === 'family-manage',
    );
    const hub = CONTRIBUTION_UI_CAPABILITY_REGISTRY.find(
      (d) => d.id === 'family-hub',
    );
    expect(manage?.requireAnyOf).toEqual(['choir.contribution.oversight@choir']);
    expect(hub?.requireAnyOf).toEqual(
      expect.arrayContaining(['choir.contribution.oversight@choir']),
    );
  });
});
