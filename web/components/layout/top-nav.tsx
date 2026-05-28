"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { DashboardExperience } from "@/core/auth/rbac";
import type { AuthProfile } from "@/core/api/types";

export function TopNav({
  title,
  subtitle,
  profile,
  experience,
  onOpenMenu,
  onLogout,
}: Readonly<{
  title: string;
  subtitle: string;
  profile: AuthProfile;
  experience: DashboardExperience;
  onOpenMenu: () => void;
  onLogout: () => Promise<void> | void;
}>) {
  const t = useTranslations();
  const displayName = [profile.member?.firstName, profile.member?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-xs)] lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CmmsButton
              type="button"
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={onOpenMenu}
            >
              {t("shell.menu")}
            </CmmsButton>
            <CmmsBadge variant="info">{t(`shell.experience.${experience}`)}</CmmsBadge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] break-words lg:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)] break-words">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <CmmsButton type="button" variant="secondary" size="sm" onClick={onLogout}>
            {t("common.logout")}
          </CmmsButton>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-xl)] bg-[var(--surface-muted)] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
          {(profile.member?.firstName?.[0] ?? profile.email[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-[var(--foreground)] break-words">
            {displayName || profile.email}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] break-all">{profile.email}</p>
        </div>
      </div>
    </header>
  );
}
