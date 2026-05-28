import type { DashboardExperience } from "@/core/auth/rbac";
import type { AuthProfile } from "@/core/api/types";

export interface ShellNavItem {
  href: string;
  label: string;
  description: string;
  experiences?: DashboardExperience[];
}

const summaryKeyByExperience: Record<DashboardExperience, string> = {
  member: "shell.memberSummary",
  leader: "shell.leaderSummary",
  "super-admin": "shell.adminSummary",
};

export function getShellNavigation(
  profile: AuthProfile | null,
  experience: DashboardExperience,
  t: (key: string) => string,
): ShellNavItem[] {
  const items: ShellNavItem[] = [
    {
      href: "/dashboard",
      label: t("shell.navDashboard"),
      description: t(summaryKeyByExperience[experience]),
    },
    {
      href: "/dashboard/events",
      label: t("shell.navEvents"),
      description: t("shell.eventsSummary"),
    },
    {
      href: "/dashboard/admin",
      label: t("shell.navAdmin"),
      description: t("shell.adminSummary"),
      experiences: ["super-admin"],
    },
  ];

  return items.filter((item) => {
    if (!item.experiences?.length) {
      return true;
    }

    return item.experiences.includes(experience) && profile != null;
  });
}

export function getShellPageMeta(
  pathname: string,
  experience: DashboardExperience,
  t: (key: string) => string,
) {
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

  return {
    title: t("shell.navDashboard"),
    subtitle: t(summaryKeyByExperience[experience]),
  };
}
