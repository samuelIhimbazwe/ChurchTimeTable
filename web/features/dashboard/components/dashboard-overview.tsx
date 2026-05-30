"use client";

import { useTranslations } from "next-intl";

import { getDashboardExperience } from "@/core/auth/rbac";
import { useSessionStore } from "@/core/auth/session-store";
import { FirstLoginWelcome } from "@/features/auth/components/first-login-welcome";
import { LeaderDashboard } from "@/features/dashboard/components/leader-dashboard";
import { MemberDashboard } from "@/features/dashboard/components/member-dashboard";
import { SuperAdminDashboard } from "@/features/dashboard/components/super-admin-dashboard";

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const profile = useSessionStore((state) => state.profile);
  const experience = getDashboardExperience(profile);

  if (!profile) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
        {t("loadingDashboard")}
      </div>
    );
  }

  if (experience === "super-admin") {
    return (
      <>
        <FirstLoginWelcome />
        <SuperAdminDashboard />
      </>
    );
  }

  if (experience === "leader") {
    return (
      <>
        <FirstLoginWelcome />
        <LeaderDashboard />
      </>
    );
  }

  return (
    <>
      <FirstLoginWelcome />
      <MemberDashboard />
    </>
  );
}
