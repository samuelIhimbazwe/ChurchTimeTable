import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { CHOIR_OPS_CAPABILITY_IDS } from './ops-capability-ids';
import { OPS_UI_CAPABILITY_REGISTRY } from './ops-ui-capability-registry';

describe('reports capability contract', () => {
  it('defines choir.report.export@choir in ops capability ids', () => {
    expect(CHOIR_OPS_CAPABILITY_IDS).toContain('choir.report.export@choir');
  });

  it('aliases report:export to choir.report.export@choir', () => {
    expect(LEGACY_PERMISSION_ALIASES['report:export']).toEqual([
      'choir.report.export@choir',
    ]);
  });

  it('defines ops-reports-hub and ops-reports-export UI capabilities', () => {
    const hub = OPS_UI_CAPABILITY_REGISTRY.find((d) => d.id === 'ops-reports-hub');
    const exportCap = OPS_UI_CAPABILITY_REGISTRY.find(
      (d) => d.id === 'ops-reports-export',
    );
    expect(hub?.requireAnyOf).toEqual(
      expect.arrayContaining(['choir.ops.view@choir', 'choir.welfare.view@choir']),
    );
    expect(exportCap?.requireAnyOf).toEqual(
      expect.arrayContaining(['choir.report.export@choir']),
    );
  });
});
