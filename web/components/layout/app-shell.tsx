"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { logoutRequest } from "@/core/api/http";
import { getDashboardExperience } from "@/core/auth/rbac";
import {
  canAccessRoute,
  phoneEnforcementRedirectRoute,
} from "@/core/auth/phone-enforcement";
import { useSessionStore } from "@/core/auth/session-store";
import { usePathname, useRouter } from "@/i18n/routing";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import {
  getShellNavigationGroups,
  getShellPageMeta,
} from "@/components/layout/navigation";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { PhoneMigrationBanner } from "@/features/profile/components/phone-migration-banner";

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const status = useSessionStore((state) => state.status);
  const [menuOpen, setMenuOpen] = useState(false);

  const shouldWrap =
    pathname.startsWith("/dashboard") && status === "ready" && profile != null;

  useEffect(() => {
    if (!shouldWrap || !profile) {
      return;
    }
    if (!canAccessRoute(profile, pathname)) {
      router.replace(phoneEnforcementRedirectRoute());
    }
  }, [pathname, profile, router, shouldWrap]);

  if (!shouldWrap || !profile) {
    return children;
  }

  const experience = getDashboardExperience(profile);
  const navigationGroups = getShellNavigationGroups(profile, experience, t);
  const pageMeta = getShellPageMeta(pathname, experience, t);

  async function handleLogout() {
    await logoutRequest();
    router.replace("/login");
  }

  const displayName = [profile.member?.firstName, profile.member?.lastName]
    .filter(Boolean)
    .join(" ");
  const userRole = t(`shell.experience.${experience}`);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="cmms-content-wide flex min-h-screen gap-4 px-4 py-4 lg:gap-6 lg:px-6 lg:py-6">
        <div className="hidden lg:block lg:w-[260px] lg:shrink-0">
          <Sidebar
            groups={navigationGroups}
            activePath={pathname}
            className="sticky top-6 max-h-[calc(100vh-3rem)]"
            userName={displayName || profile.email}
            userRole={userRole}
          />
        </div>
        <div className="min-w-0 flex-1">
          <TopNav
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            profile={profile}
            experience={experience}
            onOpenMenu={() => setMenuOpen(true)}
            onLogout={handleLogout}
          />
          <main className="cmms-page-stack mt-6 min-w-0">
            <PhoneMigrationBanner profile={profile} />
            {children}
          </main>
        </div>
      </div>
      <CmmsModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("shell.menu")}
        closeLabel={t("common.close")}
        className="max-w-sm"
      >
        <Sidebar
          groups={navigationGroups}
          activePath={pathname}
          className="max-w-none border-none bg-transparent p-0 shadow-none"
          onNavigate={() => setMenuOpen(false)}
          userName={displayName || profile.email}
          userRole={userRole}
        />
      </CmmsModal>
    </div>
  );
}
