import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  legacyRecordsHubLinkVisible,
  LEGACY_RECORDS_HUB_PATH,
  pageAccessForRecordsHubRoute,
  recordsHubNavItemVisible,
} from '../../../../web/lib/navigation/records-hub-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const secretaryAuths = {
  logisticsAuth: {
    userId: 'sec',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.document.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  logisticsAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
  opsAuth: {
    userId: 'mem',
    choirId: PILOT_CHOIR,
    capabilities: [],
  } satisfies ResolvedAuth,
};

describe('records hub nav ↔ page access parity', () => {
  it('legacy and scoped records paths use same gate via capability router', () => {
    const check = buildCapabilityRouterFromAuths(secretaryAuths);
    expect(recordsHubNavItemVisible(LEGACY_RECORDS_HUB_PATH, check)).toBe(
      pageAccessForRecordsHubRoute(LEGACY_RECORDS_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'records');
    expect(recordsHubNavItemVisible(scoped, check)).toBe(
      pageAccessForRecordsHubRoute(scoped, check),
    );
  });

  it('secretary sees legacy records hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths(secretaryAuths);
    expect(legacyRecordsHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyRecordsHubLinkVisible(['choir.records.view'])).toBe(true);
    expect(legacyRecordsHubLinkVisible(['audit:read'])).toBe(true);
    expect(legacyRecordsHubLinkVisible(['choir.document.manage'])).toBe(true);
    expect(legacyRecordsHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser includes records hub when capability router grants access', () => {
    const check = buildCapabilityRouterFromAuths(secretaryAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_RECORDS_HUB_PATH),
    ).toBe(true);
  });

  it('getChoirNavForUser omits records hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasRecordsLink =
      roleSection?.items.some((i) => i.path === LEGACY_RECORDS_HUB_PATH) ?? false;
    expect(hasRecordsLink).toBe(false);
  });
});
