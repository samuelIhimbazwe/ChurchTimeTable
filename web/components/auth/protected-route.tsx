"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { UnauthorizedState } from "@/components/auth/unauthorized-state";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSessionStore } from "@/core/auth/session-store";

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
}: Readonly<{
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}>) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const profile = useSessionStore((state) => state.profile);
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === "ready" && !accessToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, pathname, router, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const hasRequiredRole =
    !requiredRoles || requiredRoles.some((role) => profile?.roles.includes(role));
  const hasRequiredPermission =
    !requiredPermissions ||
    requiredPermissions.some((permission) =>
      profile?.permissions.includes(permission),
    );

  if (!hasRequiredRole || !hasRequiredPermission) {
    return <UnauthorizedState description={t("roleGuard")} />;
  }

  return children;
}
