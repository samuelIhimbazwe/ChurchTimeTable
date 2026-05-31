import type { DashboardExperience } from "@/core/auth/rbac";

import { hasPermission } from "@/core/auth/rbac";
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
      href: "/dashboard/events",
      label: t("shell.navEvents"),
      description: t("shell.eventsSummary"),
      requiredPermissions: ["event:read"],
    },
    {
      href: "/dashboard/attendance",
      label: t("shell.navAttendance"),
      description: t("shell.attendanceSummary"),
      requiredPermissions: [
        "event:read",
        "attendance:write",
        "attendance.mark",
        "protocol.attendance.manage",
        "protocol.team.head",
        "protocol.team.manage",
        "protocol.oversight",
        "protocol.operational.monitor",
        "choir.attendance.manage",
        "choir.oversight",
        "choir.operations.manage",
        "report:export",
      ],
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
      requiredPermissions: [
        "swap:manage",
        "event:read",
        "protocol.team.head",
        "protocol.team.manage",
        "protocol.oversight",
        "protocol.operational.monitor",
        "report:export",
      ],
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
      requiredPermissions: [
        "finance:read",
        "choir.finance.view",
        "choir.finance.manage",
        "protocol.finance.view",
        "protocol.finance.manage",
        "ministry.finance.oversight",
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
      href: "/dashboard/finance/my-contributions",
      label: t("shell.navMyContributions"),
      description: t("shell.myContributionsSummary"),
    },
  ];

  const adminItems: ShellNavItem[] = [
    {
      href: "/dashboard/admin",
      label: t("shell.navAdmin"),
      description: t("shell.adminSummary"),
      experiences: ["super-admin"],
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
    groups.filter((group) => group.items.length > 0),
    profile,
  );
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
    "/dashboard/finance/my-contributions",
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
