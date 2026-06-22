import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { can } from '../../../../web/lib/choir/capability-can';
import { uiCapabilityVisible } from '../../../../web/lib/choir/contribution-ui-capability-registry';

const coordinatorAuth: ResolvedAuth = {
  userId: 'coord',
  choirId: 'c1',
  capabilities: [{ id: 'choir.contribution.oversight@choir' }],
};

const reviewerAuth: ResolvedAuth = {
  userId: 'vp',
  choirId: 'c1',
  capabilities: [{ id: 'choir.join.review@choir' }],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: 'c1',
  capabilities: [],
};

function check(auth: ResolvedAuth) {
  return (capId: string) => can(auth, capId);
}

describe('family UI capabilities', () => {
  it('coordinator can manage families', () => {
    const routeCheck = check(coordinatorAuth);
    expect(uiCapabilityVisible('family-manage', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('family-hub', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('family-coordinator-hub', routeCheck)).toBe(
      true,
    );
  });

  it('join reviewer can open family hub but not manage', () => {
    const routeCheck = check(reviewerAuth);
    expect(uiCapabilityVisible('family-hub', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('family-manage', routeCheck)).toBe(false);
  });

  it('member without caps cannot access family hub', () => {
    const routeCheck = check(memberAuth);
    expect(uiCapabilityVisible('family-hub', routeCheck)).toBe(false);
  });
});
