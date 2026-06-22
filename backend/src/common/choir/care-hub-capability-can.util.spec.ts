import { can } from '../../../../web/lib/choir/capability-can';
import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { uiCapabilityVisible } from '../../../../web/lib/choir/care-hub-ui-capability-registry';

const welfareAuth: ResolvedAuth = {
  userId: 'care',
  choirId: 'c1',
  capabilities: [
    { id: 'choir.welfare.view@choir' },
    { id: 'choir.welfare.manage@choir' },
  ],
};

const disciplineOnlyAuth: ResolvedAuth = {
  userId: 'disc',
  choirId: 'c1',
  capabilities: [{ id: 'choir.discipline.manage@choir' }],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: 'c1',
  capabilities: [],
};

function check(auth: ResolvedAuth) {
  return (capId: string) => can(auth, capId);
}

describe('care hub UI capabilities', () => {
  it('welfare officer can access care hub and command home', () => {
    const routeCheck = check(welfareAuth);
    expect(uiCapabilityVisible('care-hub', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('care-command-home', routeCheck)).toBe(true);
  });

  it('discipline manager can manage rules and notices', () => {
    const routeCheck = check(disciplineOnlyAuth);
    expect(uiCapabilityVisible('care-hub', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('care-rules-manage', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('care-notices-send', routeCheck)).toBe(true);
    expect(uiCapabilityVisible('care-command-home', routeCheck)).toBe(false);
  });

  it('member without caps cannot access care hub', () => {
    const routeCheck = check(memberAuth);
    expect(uiCapabilityVisible('care-hub', routeCheck)).toBe(false);
  });
});
