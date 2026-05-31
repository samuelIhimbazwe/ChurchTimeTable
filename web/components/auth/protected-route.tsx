"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { UnauthorizedState } from "@/components/auth/unauthorized-state";
import { usePathname, useRouter } from "@/i18n/routing";
import { hasEffectivePermission } from "@/core/auth/governance-permissions";
import { isPendingMember } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  allowPending = false,
}: Readonly<{
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  allowPending?: boolean;
}>) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const profile = useSessionStore((state) => state.profile);
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status !== "ready" || !accessToken) {
      return;
    }

    if (isPendingMember(profile) && !allowPending && pathname !== "/pending-approval") {
      router.replace("/pending-approval");
      return;
    }

    if (
      !isPendingMember(profile) &&
      pathname === "/pending-approval" &&
      !allowPending
    ) {
      router.replace("/dashboard");
    }
  }, [accessToken, allowPending, pathname, profile, router, status]);

  useEffect(() => {
    if (status === "ready" && !accessToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, pathname, router, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted-foreground)]">
        {t("loading")}
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  if (isPendingMember(profile) && !allowPending) {
    return null;
  }

  const hasRequiredRole =
    !requiredRoles || requiredRoles.some((role) => profile?.roles.includes(role));
  const perms = profile?.permissions ?? [];
  const hasRequiredPermission =
    !requiredPermissions ||
    requiredPermissions.some((permission) =>
      hasEffectivePermission(perms, permission),
    );

  if (!hasRequiredRole || !hasRequiredPermission) {
    return <UnauthorizedState description={t("roleGuard")} />;
  }

  return children;
}
