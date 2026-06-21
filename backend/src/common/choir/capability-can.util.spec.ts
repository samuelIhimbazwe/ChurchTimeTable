import { can, dedupeScopedCapabilities } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('capability-can.util', () => {
  const headAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [
      { id: 'choir.contribution.approve@family', scopeId: 'fam-a' },
      { id: 'choir.contribution.view@family', scopeId: 'fam-a' },
    ],
  };

  const treasurerAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [{ id: 'choir.contribution.verify@choir' }],
  };

  const coordinatorAuth: ResolvedAuth = {
    userId: 'u3',
    choirId: 'c1',
    capabilities: [{ id: 'choir.contribution.oversight@choir' }],
  };

  it('family head approves own family', () => {
    expect(
      can(headAuth, 'choir.contribution.approve@family', 'fam-a'),
    ).toBe(true);
  });

  it('family head cannot approve a different family', () => {
    expect(
      can(headAuth, 'choir.contribution.approve@family', 'fam-b'),
    ).toBe(false);
  });

  it('treasurer verifies regardless of family', () => {
    expect(can(treasurerAuth, 'choir.contribution.verify@choir')).toBe(true);
    expect(
      can(treasurerAuth, 'choir.contribution.approve@family', 'fam-a'),
    ).toBe(false);
  });

  it('coordinator oversight does not satisfy approve@family', () => {
    expect(can(coordinatorAuth, 'choir.contribution.oversight@choir')).toBe(
      true,
    );
    expect(
      can(coordinatorAuth, 'choir.contribution.approve@family', 'fam-a'),
    ).toBe(false);
  });

  it('dedupes scoped capabilities', () => {
    const merged = dedupeScopedCapabilities([
      { id: 'choir.contribution.view@choir' },
      { id: 'choir.contribution.view@choir' },
      { id: 'choir.contribution.view@family', scopeId: 'f1' },
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe('expired acting seat (simulated)', () => {
  it('excludes capabilities not present after expiry', () => {
    const auth: ResolvedAuth = {
      userId: 'u4',
      choirId: 'c1',
      capabilities: [],
    };
    expect(can(auth, 'choir.contribution.verify@choir')).toBe(false);
  });
});
