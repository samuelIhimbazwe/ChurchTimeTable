import { can } from '../../../../web/lib/choir/capability-can';
import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { uiCapabilityVisible } from '../../../../web/lib/choir/choir-hub-ui-capability-registry';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const leaderAuth: ResolvedAuth = {
  userId: 'lead',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.join.review@choir' },
    { id: 'choir.ops.manage@choir' },
    { id: 'choir.ops.attendance@choir' },
    { id: 'choir.welfare.view@choir' },
  ],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function check(auth: ResolvedAuth) {
  return (capId: string) => can(auth, capId);
}

describe('choir hub UI capabilities', () => {
  it('leader sees hub leadership tiles', () => {
    const routeCheck = check(leaderAuth);
    expect(uiCapabilityVisible('hub-new-activity', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('hub-pending-approvals', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('hub-welfare-alerts', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('hub-pending-swaps', routeCheck)).toBe(true);
  });

  it('member without caps does not see leadership tiles', () => {
    const routeCheck = check(memberAuth);
    expect(uiCapabilityVisible('hub-pending-approvals', routeCheck)).toBe(false);
    expect(uiCapabilityVisible('hub-new-activity', routeCheck)).toBe(false);
  });
});
