import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import { uiCapabilityVisible } from './ops-ui-capability-registry';
import { hasLegacyChoirReportsView } from './choir-reports-http-access.service';

describe('choir reports HTTP access (capability + legacy)', () => {
  const welfareViewAuth: ResolvedAuth = {
    userId: 'care',
    choirId: 'c1',
    capabilities: [{ id: 'choir.welfare.view@choir' }],
  };

  const exportAuth: ResolvedAuth = {
    userId: 'sec',
    choirId: 'c1',
    capabilities: [{ id: 'choir.report.export@choir' }],
  };

  it('welfare view satisfies ops-reports-hub', () => {
    const routeCheck = buildCapabilityRouterFromAuths({
      welfareAuth: welfareViewAuth,
    });
    expect(uiCapabilityVisible('ops-reports-hub', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('ops-reports-export', routeCheck)).toBe(false);
  });

  it('report export cap satisfies ops-reports-export', () => {
    const routeCheck = buildCapabilityRouterFromAuths({
      opsAuth: exportAuth,
    });
    expect(uiCapabilityVisible('ops-reports-export', routeCheck)).toBe(true);
  });

  it('legacy choir reports view permissions', () => {
    expect(hasLegacyChoirReportsView(['choir.reports.view'])).toBe(true);
    expect(hasLegacyChoirReportsView([])).toBe(false);
  });
});
