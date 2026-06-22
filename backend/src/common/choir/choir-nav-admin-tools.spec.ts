import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { can } from '../../../../web/lib/choir/capability-can';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  adminToolsForCapabilities,
  getComposedChoirNav,
  hasChoirWideAdminAccess,
} from '../../../../web/lib/navigation/choir-nav';
import { uiCapabilityVisible as adminUiVisible } from '../../../../web/lib/choir/admin-hub-ui-capability-registry';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const presidentAuths = {
  joinAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [
      { id: 'choir.join.review@choir' },
      { id: 'choir.member.manage@choir' },
    ],
  } satisfies ResolvedAuth,
  opsAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.ops.manage@choir' }],
  } satisfies ResolvedAuth,
  rosterAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.member.view@choir' }],
  } satisfies ResolvedAuth,
  contributionAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.contribution.view@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  joinAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

function routeCheck(auths: typeof presidentAuths) {
  return buildCapabilityRouterFromAuths(auths);
}

describe('choir-nav admin tools (capability)', () => {
  it('president routeCheck exposes admin-hub UI caps', () => {
    const check = routeCheck(presidentAuths);
    expect(adminUiVisible('admin-hub', check)).toBe(true);
    expect(adminUiVisible('admin-join-link', check)).toBe(true);
    expect(adminUiVisible('admin-roles-link', check)).toBe(true);
  });

  it('adminToolsForCapabilities mirrors admin-hub registry', () => {
    const check = routeCheck(presidentAuths);
    const paths = adminToolsForCapabilities(PILOT_CHOIR, check).map((i) => i.path);
    expect(paths).toContain(choirPath(PILOT_CHOIR, 'admin'));
    expect(paths).toContain(choirPath(PILOT_CHOIR, 'join-requests'));
    expect(paths).toContain(choirPath(PILOT_CHOIR, 'roles'));
  });

  it('member without caps gets no admin tools', () => {
    const check = routeCheck(memberAuths);
    expect(adminToolsForCapabilities(PILOT_CHOIR, check)).toHaveLength(0);
    expect(hasChoirWideAdminAccess([], [], check)).toBe(false);
  });

  it('getComposedChoirNav uses capability router for admin section', () => {
    const check = routeCheck(presidentAuths);
    const sections = getComposedChoirNav(
      PILOT_CHOIR,
      'Pilot Choir',
      [],
      [],
      [{ roleKey: 'president' }],
      presidentAuths.contributionAuth,
      check,
    );
    const adminSection = sections.find((s) => s.section === 'Administration');
    expect(adminSection?.items.some((i) => i.path === choirPath(PILOT_CHOIR, 'admin'))).toBe(
      true,
    );
    const treasury = sections.find((s) => s.section === 'Treasury');
    expect(treasury?.items.some((i) => i.path === choirPath(PILOT_CHOIR, 'stewardship'))).toBe(
      true,
    );
    const ops = sections.find((s) => s.section === 'Operations');
    expect(ops?.items.some((i) => i.path === choirPath(PILOT_CHOIR, 'scheduling'))).toBe(true);
  });

  it('legacy permission fallback when capabilityCheck omitted', () => {
    const sections = getComposedChoirNav(
      PILOT_CHOIR,
      'Pilot Choir',
      ['member:manage', 'choir.ops.manage'],
      [],
      [],
    );
    const adminSection = sections.find((s) => s.section === 'Administration');
    expect(adminSection?.items.length).toBeGreaterThan(0);
  });
});

describe('choir-nav capability router parity', () => {
  it('member.manage routes across join/sponsor/roster auths', () => {
    const check = (capId: string) => can(presidentAuths.joinAuth, capId);
    expect(check('choir.member.manage@choir')).toBe(true);
  });
});
