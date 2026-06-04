"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import {
  canAccessExecutiveStewardship,
  EXECUTIVE_STEWARDSHIP_PERMISSIONS,
} from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";

export function StewardshipGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations("executiveStewardship");
  const profile = useSessionStore((s) => s.profile);
  const perms = profile?.permissions ?? [];

  if (profile && !canAccessExecutiveStewardship(perms)) {
    return (
      <OperationalScreen className="cmms-content-wide pb-24 lg:pb-8">
        <CmmsEmptyState title={t("noAccessTitle")} description={t("noAccessMessage")} />
      </OperationalScreen>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[...EXECUTIVE_STEWARDSHIP_PERMISSIONS]}>
      {children}
    </ProtectedRoute>
  );
}
