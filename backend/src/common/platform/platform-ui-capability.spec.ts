import {
  platformUiCapabilityVisible,
  PLATFORM_UI_CAPABILITY_REGISTRY,
} from '../../../../web/lib/platform/platform-ui-capability-registry';
import { buildPlatformCapabilityRouter } from '../../../../web/lib/platform/platform-capability-router';
import { mapPermissionToPlatformCapabilities } from '../../../../web/lib/platform/platform-capability.util';
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

function platformCheckFromPermissions(permissions: string[]) {
  const mapped = permissions.flatMap(mapPermissionToPlatformCapabilities);
  const auths = {
    protocolAuth: {
      userId: 'test',
      choirId: '00000000-0000-0000-0000-000000000099',
      capabilities: mapped
        .filter((m) => m.domain === 'protocol')
        .map((m) => ({ id: m.id })),
    },
    churchAuth: {
      userId: 'test',
      choirId: 'church',
      capabilities: mapped
        .filter((m) => m.domain === 'church')
        .map((m) => ({ id: m.id })),
    },
    platformAuth: {
      userId: 'test',
      choirId: 'platform',
      capabilities: mapped
        .filter((m) => m.domain === 'platform')
        .map((m) => ({ id: m.id })),
    },
  };
  return buildPlatformCapabilityRouter(auths);
}

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

  it('protocol team manage via scoped capabilities', () => {
    const check = platformCheckFromPermissions(['protocol.team.manage']);
    expect(platformUiCapabilityVisible('protocol-team-manage', check)).toBe(true);
    const manageOnly = platformCheckFromPermissions(['protocol.manage']);
    expect(platformUiCapabilityVisible('protocol-team-manage', manageOnly)).toBe(true);
    expect(platformUiCapabilityVisible('protocol-team-manage', platformCheckFromPermissions([]))).toBe(false);
  });

  it('choir service schedule via scoped capabilities', () => {
    const check = platformCheckFromPermissions(['church.choir.ops.schedule']);
    expect(platformUiCapabilityVisible('choir-service-request-schedule', check)).toBe(true);
    expect(platformUiCapabilityVisible('choir-service-request-schedule', platformCheckFromPermissions([]))).toBe(false);
  });
});
