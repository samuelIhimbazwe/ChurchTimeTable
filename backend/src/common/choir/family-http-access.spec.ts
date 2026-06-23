import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { uiCapabilityVisible } from '../../../../web/lib/choir/contribution-ui-capability-registry';
import {
  buildFamilyHubCapabilityCheck,
  hasFamilyManageFromAuths,
} from './family-access.util';
import {
  canManageFamilies,
  canViewFamilies,
} from '../governance/governance-permissions.util';

describe('family HTTP access (capability + legacy)', () => {
  const coordinatorContribution: ResolvedAuth = {
    userId: 'fc',
    choirId: 'c1',
    capabilities: [{ id: 'choir.contribution.oversight@choir' }],
  };

  const memberContribution: ResolvedAuth = {
    userId: 'mem',
    choirId: 'c1',
    capabilities: [],
  };

  it('family-hub visible for contribution oversight', () => {
    const check = buildFamilyHubCapabilityCheck(
      coordinatorContribution,
      undefined,
      undefined,
      undefined,
    );
    expect(uiCapabilityVisible('family-hub', check)).toBe(true);
  });

  it('family-manage from oversight auth', () => {
    expect(hasFamilyManageFromAuths(coordinatorContribution)).toBe(true);
    expect(hasFamilyManageFromAuths(memberContribution)).toBe(false);
  });

  it('legacy view/manage permissions still recognized', () => {
    expect(canViewFamilies(['family:view'])).toBe(true);
    expect(canManageFamilies(['choir.family.manage'])).toBe(true);
    expect(canViewFamilies([])).toBe(false);
  });
});
