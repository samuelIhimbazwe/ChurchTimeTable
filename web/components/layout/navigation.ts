import type { DashboardExperience } from "@/core/auth/rbac";

import { hasPermission } from "@/core/auth/rbac";
import {
  ATTENDANCE_ACCESS_PERMISSIONS,
  COVERAGE_ACCESS_PERMISSIONS,
  EXECUTIVE_STEWARDSHIP_PERMISSIONS,
  FINANCE_NAV_PERMISSIONS,
  PLATFORM_ADMIN_VIEW_PERMISSIONS,
} from "@/core/auth/governance-permissions";
import { shouldHideOperationalNavigation } from "@/core/auth/phone-enforcement";

import type { AuthProfile } from "@/core/api/types";

export interface ShellNavItem {
  href: string;
  label: string;
  description: string;
  experiences?: DashboardExperience[];
  requiredPermissions?: string[];
}

export interface ShellNavGroup {
  id: string;
  labelKey?: string;
  items: ShellNavItem[];
}

const summaryKeyByExperience: Record<DashboardExperience, string> = {
  member: "shell.memberSummary",
  leader: "shell.leaderSummary",
  "super-admin": "shell.adminSummary",
};

function filterNavItems(
  items: ShellNavItem[],
  profile: AuthProfile | null,
  experience: DashboardExperience,
): ShellNavItem[] {
  return items.filter((item) => {
    if (item.experiences?.length && !item.experiences.includes(experience)) {
      return false;
    }
    if (item.requiredPermissions?.length) {
      return hasPermission(profile, item.requiredPermissions);
    }
    return true;
  });
}

/** Mockup-aligned navigation with permission filtering. */
export function getShellNavigationGroups(
  profile: AuthProfile | null,
  experience: DashboardExperience,
  t: (key: string) => string,
): ShellNavGroup[] {
  const mainItems: ShellNavItem[] = [
    {
      href: "/dashboard",
      label: t("shell.navDashboard"),
      description: t(summaryKeyByExperience[experience]),
    },
    {
      href: "/dashboard/members",
      label: t("shell.navMembers"),
      description: t("shell.membersSummary"),
      requiredPermissions: ["member:manage"],
    },
    {
      href: "/dashboard/families",
      label: t("shell.navFamilies"),
      description: t("shell.familiesSummary"),
      requiredPermissions: ["family:view", "family:manage"],
    },
    {
      href: "/dashboard/ministries",
      label: t("shell.navMinistries"),
      description: t("shell.ministriesSummary"),
      requiredPermissions: ["ministry.view", "ministry.manage"],
    },
    {
      href: "/dashboard/units",
      label: t("shell.navUnits"),
      description: t("shell.unitsSummary"),
      requiredPermissions: [
        "operational_unit.view",
        "operational_unit.manage",
      ],
    },
    {
      href: "/dashboard/church",
      label: t("shell.navChurchIntelligence"),
      description: t("shell.churchIntelligenceSummary"),
      requiredPermissions: [
        "church.intelligence.view",
        "church.governance.view",
      ],
    },
    {
      href: "/dashboard/operations",
      label: t("shell.navChurchOperations"),
      description: t("shell.churchOperationsSummary"),
      requiredPermissions: ["operations.view", "operations.manage"],
    },
    {
      href: "/dashboard/assets",
      label: t("shell.navAssets"),
      description: t("shell.assetsSummary"),
      requiredPermissions: ["asset.view", "asset.manage"],
    },
    {
      href: "/dashboard/events",
      label: t("shell.navEvents"),
      description: t("shell.eventsSummary"),
      requiredPermissions: ["event:read"],
    },
    {
      href: "/dashboard/attendance",
      label: t("shell.navAttendance"),
      description: t("shell.attendanceSummary"),
      requiredPermissions: [...ATTENDANCE_ACCESS_PERMISSIONS],
    },
    {
      href: "/dashboard/operational",
      label: t("shell.navOperational"),
      description: t("shell.operationalSummary"),
      requiredPermissions: [
        "protocol.oversight",
        "protocol.team.manage",
        "protocol.team.head",
        "protocol.operational.monitor",
        "choir.oversight",
        "choir.operations.manage",
        "choir.attendance.manage",
      ],
    },
    {
      href: "/dashboard/coverage",
      label: t("shell.navCoverage"),
      description: t("shell.coverageSummary"),
      requiredPermissions: [...COVERAGE_ACCESS_PERMISSIONS],
    },
    {
      href: "/dashboard/governance",
      label: t("shell.navGovernance"),
      description: t("shell.governanceSummary"),
      requiredPermissions: [
        "committee.member.manage",
        "committee.role.manage",
        "member:manage",
      ],
    },
    {
      href: "/dashboard/finance",
      label: t("shell.navFinance"),
      description: t("shell.financeSummary"),
      requiredPermissions: [...FINANCE_NAV_PERMISSIONS],
    },
    {
      href: "/dashboard/stewardship",
      label: t("shell.navExecutiveStewardship"),
      description: t("shell.executiveStewardshipSummary"),
      requiredPermissions: [...EXECUTIVE_STEWARDSHIP_PERMISSIONS],
    },
    {
      href: "/dashboard/choir",
      label: t("shell.navChoirOperations"),
      description: t("shell.choirOperationsSummary"),
      requiredPermissions: [
        "choir.welfare.view",
        "choir.music.view",
        "choir.rehearsal.manage",
        "choir.contribution.view.all",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/welfare",
      label: t("shell.navWelfare"),
      description: t("shell.welfareSummary"),
      requiredPermissions: ["choir.welfare.view", "choir.welfare.manage"],
    },
    {
      href: "/dashboard/music",
      label: t("shell.navMusic"),
      description: t("shell.musicSummary"),
      requiredPermissions: ["choir.music.view", "choir.music.manage"],
    },
    {
      href: "/dashboard/rehearsals",
      label: t("shell.navRehearsals"),
      description: t("shell.rehearsalsSummary"),
      requiredPermissions: [
        "choir.rehearsal.view",
        "choir.rehearsal.manage",
        "event:read",
      ],
    },
    {
      href: "/dashboard/devotions",
      label: t("shell.navDevotions"),
      description: t("shell.devotionsSummary"),
      requiredPermissions: ["choir.devotion.view"],
    },
    {
      href: "/dashboard/choir/roles",
      label: t("shell.navChoirRoles"),
      description: t("shell.choirRolesSummary"),
      requiredPermissions: ["choir.custom_role.manage"],
    },
    {
      href: "/dashboard/choir/reports",
      label: t("shell.navChoirReports"),
      description: t("shell.choirReportsSummary"),
      requiredPermissions: [
        "choir.welfare.view",
        "choir.welfare.manage",
        "choir.music.view",
        "choir.music.manage",
        "choir.rehearsal.view",
        "choir.rehearsal.manage",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/choir/documents",
      label: t("shell.navChoirDocuments"),
      description: t("shell.choirDocumentsSummary"),
      requiredPermissions: [
        "choir.document.manage",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/choir/meetings",
      label: t("shell.navChoirMeetings"),
      description: t("shell.choirMeetingsSummary"),
      requiredPermissions: [
        "choir.meeting.manage",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/choir/uniforms",
      label: t("shell.navChoirUniforms"),
      description: t("shell.choirUniformsSummary"),
      requiredPermissions: [
        "choir.uniform.manage",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/choir/equipment",
      label: t("shell.navChoirEquipment"),
      description: t("shell.choirEquipmentSummary"),
      requiredPermissions: [
        "choir.equipment.manage",
        "choir.operations.manage",
      ],
    },
    {
      href: "/dashboard/members/pending",
      label: t("shell.navPendingMembers"),
      description: t("shell.pendingMembersSummary"),
      requiredPermissions: ["member:manage"],
    },
  ];

  const personalItems: ShellNavItem[] = [
    {
      href: "/dashboard/settings/profile",
      label: t("shell.navProfile"),
      description: t("shell.profileSummary"),
    },
    {
      href: "/dashboard/contributions",
      label: t("shell.navMyContributions"),
      description: t("shell.myContributionsSummary"),
    },
    {
      href: "/dashboard/family/contributions",
      label: t("shell.navFamilyContributions"),
      description: t("shell.familyContributionsSummary"),
    },
  ];

  const adminItems: ShellNavItem[] = [
    {
      href: "/dashboard/admin",
      label: t("shell.navAdmin"),
      description: t("shell.adminSummary"),
      requiredPermissions: [...PLATFORM_ADMIN_VIEW_PERMISSIONS],
    },
  ];

  const groups: ShellNavGroup[] = [
    {
      id: "main",
      labelKey: "shell.navGroupMain",
      items: filterNavItems(mainItems, profile, experience),
    },
    {
      id: "personal",
      labelKey: "shell.navGroupPersonal",
      items: filterNavItems(personalItems, profile, experience),
    },
    {
      id: "admin",
      labelKey: "shell.navGroupAdmin",
      items: filterNavItems(adminItems, profile, experience),
    },
  ];

  return filterPhoneRestrictedItems(
    filterFamilyContributionsNav(
      groups.filter((group) => group.items.length > 0),
      profile,
    ),
    profile,
  );
}

function filterFamilyContributionsNav(
  groups: ShellNavGroup[],
  profile: AuthProfile | null,
): ShellNavGroup[] {
  const familyHref = "/dashboard/family/contributions";
  const showFamily = profile?.member?.id != null;

  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href !== familyHref || showFamily),
  }));
}

function filterPhoneRestrictedItems(
  groups: ShellNavGroup[],
  profile: AuthProfile | null,
): ShellNavGroup[] {
  if (!shouldHideOperationalNavigation(profile)) {
    return groups;
  }

  const allowedHrefs = new Set([
    "/dashboard",
    "/dashboard/settings/profile",
    "/dashboard/contributions",
    "/dashboard/contributions/new",
    "/dashboard/family/contributions",
    "/dashboard/family/contributions/pending",
    "/dashboard/notifications",
  ]);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedHrefs.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Flat list for backward compatibility. */
export function getShellNavigation(
  profile: AuthProfile | null,
  experience: DashboardExperience,
  t: (key: string) => string,
): ShellNavItem[] {
  return getShellNavigationGroups(profile, experience, t).flatMap((g) => g.items);
}

export function getShellPageMeta(
  pathname: string,
  experience: DashboardExperience,
  t: (key: string) => string,
) {
  if (pathname.startsWith("/dashboard/members/pending")) {
    return {
      title: t("shell.navPendingMembers"),
      subtitle: t("shell.pendingMembersSummary"),
    };
  }

  if (/^\/dashboard\/members\/[^/]+$/.test(pathname)) {
    return {
      title: t("shell.navMembers"),
      subtitle: t("shell.memberProfileSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/members")) {
    return {
      title: t("shell.navMembers"),
      subtitle: t("shell.membersSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/governance")) {
    return {
      title: t("shell.navGovernance"),
      subtitle: t("shell.governanceSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/admin")) {
    return {
      title: t("shell.navAdmin"),
      subtitle: t("shell.adminSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/events")) {
    return {
      title: t("shell.navEvents"),
      subtitle: t("shell.eventsSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/operational")) {
    return {
      title: t("shell.navOperational"),
      subtitle: t("shell.operationalSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/attendance")) {
    return {
      title: t("shell.navAttendance"),
      subtitle: t("shell.attendanceSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/contributions/new")) {
    return {
      title: t("contributions.form.title"),
      subtitle: t("contributions.form.subtitle"),
    };
  }

  if (pathname.match(/\/dashboard\/contributions\/[^/]+$/)) {
    return {
      title: t("contributions.detail.title"),
      subtitle: t("contributions.detail.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/family/goals")) {
    return {
      title: t("familyContributions.goals.title"),
      subtitle: t("familyContributions.goals.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/family/rankings")) {
    return {
      title: t("familyContributions.rankings.title"),
      subtitle: t("familyContributions.rankings.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/family/contributions/pending")) {
    return {
      title: t("familyContributions.pending.title"),
      subtitle: t("familyContributions.pending.subtitle"),
    };
  }

  if (pathname.match(/\/dashboard\/family\/contributions\/[^/]+$/)) {
    return {
      title: t("familyContributions.detail.title"),
      subtitle: t("familyContributions.detail.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/family/contributions")) {
    return {
      title: t("familyContributions.hub.title"),
      subtitle: t("familyContributions.hub.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship/campaigns")) {
    return {
      title: t("executiveStewardship.campaigns.title"),
      subtitle: t("executiveStewardship.campaigns.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship/families")) {
    return {
      title: t("executiveStewardship.families.title"),
      subtitle: t("executiveStewardship.families.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship/contributors")) {
    return {
      title: t("executiveStewardship.contributors.title"),
      subtitle: t("executiveStewardship.contributors.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship/needs-attention")) {
    return {
      title: t("executiveStewardship.needsAttention.title"),
      subtitle: t("executiveStewardship.needsAttention.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship/adjustments")) {
    return {
      title: t("executiveStewardship.adjustments.title"),
      subtitle: t("executiveStewardship.adjustments.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/stewardship")) {
    return {
      title: t("executiveStewardship.hub.title"),
      subtitle: t("executiveStewardship.hub.subtitle"),
    };
  }

  if (pathname.startsWith("/dashboard/contributions")) {
    return {
      title: t("contributions.title"),
      subtitle: t("contributions.subtitle"),
    };
  }

  if (pathname.includes("/dashboard/finance/my-contributions")) {
    return {
      title: t("shell.navMyContributions"),
      subtitle: t("shell.myContributionsSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/finance")) {
    return {
      title: t("shell.navFinance"),
      subtitle: t("shell.financeSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/coverage")) {
    return {
      title: t("shell.navCoverage"),
      subtitle: t("shell.coverageSummary"),
    };
  }

  if (pathname.startsWith("/dashboard/settings/profile")) {
    return {
      title: t("profile.title"),
      subtitle: t("profile.subtitle"),
    };
  }

  return {
    title: t("shell.navDashboard"),
    subtitle: t(summaryKeyByExperience[experience]),
  };
}
