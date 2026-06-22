import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('roles capability-can', () => {
  const rolesAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.custom_role.manage@choir' },
      { id: 'choir.committee_role.manage@choir' },
    ],
  };

  const committeeOnlyAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [{ id: 'choir.committee_role.manage@choir' }],
  };

  it('grants custom and committee role capabilities', () => {
    expect(can(rolesAuth, 'choir.custom_role.manage@choir')).toBe(true);
    expect(can(rolesAuth, 'choir.committee_role.manage@choir')).toBe(true);
  });

  it('committee-only user lacks custom role manage', () => {
    expect(can(committeeOnlyAuth, 'choir.committee_role.manage@choir')).toBe(true);
    expect(can(committeeOnlyAuth, 'choir.custom_role.manage@choir')).toBe(false);
  });
});
