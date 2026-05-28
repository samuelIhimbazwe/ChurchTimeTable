"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { logoutRequest } from "@/core/api/http";
import { getDashboardExperience } from "@/core/auth/rbac";
import { useSessionStore } from "@/core/auth/session-store";
import { usePathname, useRouter } from "@/i18n/routing";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { getShellNavigation, getShellPageMeta } from "@/components/layout/navigation";
import { CmmsModal } from "@/components/ui/cmms-modal";

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

  const shouldWrap = pathname.startsWith("/dashboard");
  if (!shouldWrap || status !== "ready" || !profile) {
    return children;
  }

  const experience = getDashboardExperience(profile);
  const navigation = getShellNavigation(profile, experience, t);
  const pageMeta = getShellPageMeta(pathname, experience, t);

  async function handleLogout() {
    await logoutRequest();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div className="hidden lg:block lg:w-[280px] lg:shrink-0">
          <Sidebar items={navigation} activePath={pathname} className="sticky top-6" />
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
          <main className="mt-6 min-w-0">{children}</main>
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
          items={navigation}
          activePath={pathname}
          className="max-w-none border-none bg-transparent p-0 shadow-none"
          onNavigate={() => setMenuOpen(false)}
        />
      </CmmsModal>
    </div>
  );
}
