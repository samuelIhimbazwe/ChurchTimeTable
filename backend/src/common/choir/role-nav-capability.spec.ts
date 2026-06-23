import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import {
  filterRoleNavSections,
  pageAccessForRoleNavPath,
} from '../../../../web/lib/navigation/role-nav-capability';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';
import { LEGACY_BUDGET_HUB_PATH } from '../../../../web/lib/navigation/contribution-nav';
import { LEGACY_RECORDS_HUB_PATH } from '../../../../web/lib/navigation/records-hub-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const treasurerAuths = {
  contributionAuth: {
    userId: 'treasurer',
    choirId: PILOT_CHOIR,
    capabilities: [
      { id: 'choir.budget.view@choir' },
      { id: 'choir.budget.manage@choir' },
      { id: 'choir.contribution.view@choir' },
    ],
  } satisfies ResolvedAuth,
};

const secretaryAuths = {
  logisticsAuth: {
    userId: 'secretary',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.document.manage@choir' }],
  } satisfies ResolvedAuth,
  opsAuth: {
    userId: 'secretary',
    choirId: PILOT_CHOIR,
    capabilities: [{ id: 'choir.ops.view@choir' }],
  } satisfies ResolvedAuth,
};

describe('role-nav capability filtering', () => {
  it('pageAccessForRoleNavPath gates budget and records paths', () => {
    const treasurerCheck = buildCapabilityRouterFromAuths(treasurerAuths);
    const secretaryCheck = buildCapabilityRouterFromAuths(secretaryAuths);

    expect(pageAccessForRoleNavPath(LEGACY_BUDGET_HUB_PATH, treasurerCheck)).toBe(
      true,
    );
    expect(pageAccessForRoleNavPath(LEGACY_BUDGET_HUB_PATH, secretaryCheck)).toBe(
      false,
    );
    expect(pageAccessForRoleNavPath(LEGACY_RECORDS_HUB_PATH, secretaryCheck)).toBe(
      true,
    );
    expect(pageAccessForRoleNavPath(LEGACY_RECORDS_HUB_PATH, treasurerCheck)).toBe(
      false,
    );
  });

  it('filterRoleNavSections hides treasurer budget when capabilities missing', () => {
    const sections = [
      {
        section: 'Treasurer',
        items: [{ label: 'Budget hub', path: LEGACY_BUDGET_HUB_PATH, icon: () => null }],
      },
    ];
    const check = buildCapabilityRouterFromAuths({
      contributionAuth: {
        userId: 'x',
        choirId: PILOT_CHOIR,
        capabilities: [],
      },
    });
    expect(filterRoleNavSections(sections, check)).toEqual([]);
  });

  it('CHOIR_TREASURER role nav respects capability router', () => {
    const check = buildCapabilityRouterFromAuths(treasurerAuths);
    const sections = getChoirNavForUser(
      'CHOIR_TREASURER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const treasurerSection = sections.find((s) => s.section === 'Treasurer');
    expect(
      treasurerSection?.items.some((i) => i.path === LEGACY_BUDGET_HUB_PATH),
    ).toBe(true);
  });

  it('CHOIR_SECRETARY role nav includes records when capabilities grant access', () => {
    const check = buildCapabilityRouterFromAuths(secretaryAuths);
    const sections = getChoirNavForUser(
      'CHOIR_SECRETARY',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const secretarySection = sections.find((s) => s.section === 'Secretary');
    expect(
      secretarySection?.items.some((i) => i.path === LEGACY_RECORDS_HUB_PATH),
    ).toBe(true);
  });
});
