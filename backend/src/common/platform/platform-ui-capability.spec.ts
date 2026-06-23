import {
  platformUiCapabilityVisible,
  PLATFORM_UI_CAPABILITY_REGISTRY,
} from '../../../../web/lib/platform/platform-ui-capability-registry';
import {
  pageAccessForPresidentHubRoute,
} from '../../../../web/lib/navigation/president-hub-nav';
import {
  pageAccessForVicePresidentHubRoute,
} from '../../../../web/lib/navigation/vice-president-hub-nav';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const presidentAuths = {
  joinAuth: {
    userId: 'pres',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.join.review@choir' }],
  } satisfies ResolvedAuth,
};

const vpAuths = {
  opsAuth: {
    userId: 'vp',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.ops.view@choir' }],
  } satisfies ResolvedAuth,
};

describe('president / vice-president hub page access', () => {
  it('president hub path gated by capability router', () => {
    const check = buildCapabilityRouterFromAuths(presidentAuths);
    const path = choirPath(PILOT_CHOIR, 'president');
    expect(pageAccessForPresidentHubRoute(path, check)).toBe(true);
  });

  it('vice president hub path gated by capability router', () => {
    const check = buildCapabilityRouterFromAuths(vpAuths);
    const path = choirPath(PILOT_CHOIR, 'vice-president');
    expect(pageAccessForVicePresidentHubRoute(path, check)).toBe(true);
  });

  it('president hub denied without matching capabilities', () => {
    const check = buildCapabilityRouterFromAuths({});
    const path = choirPath(PILOT_CHOIR, 'president');
    expect(pageAccessForPresidentHubRoute(path, check)).toBe(false);
  });
});

describe('platform UI capability registry', () => {
  it('registry ids are unique', () => {
    const ids = PLATFORM_UI_CAPABILITY_REGISTRY.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('protocol team manage bridge matches legacy permissions', () => {
    expect(
      platformUiCapabilityVisible('protocol-team-manage', ['protocol.team.manage']),
    ).toBe(true);
    expect(
      platformUiCapabilityVisible('protocol-team-manage', ['protocol.manage']),
    ).toBe(true);
    expect(platformUiCapabilityVisible('protocol-team-manage', [])).toBe(false);
  });

  it('church schedule submit bridge', () => {
    expect(
      platformUiCapabilityVisible('church-schedule-submit', ['church.schedule.submit']),
    ).toBe(true);
    expect(platformUiCapabilityVisible('church-schedule-submit', [])).toBe(false);
  });
});
