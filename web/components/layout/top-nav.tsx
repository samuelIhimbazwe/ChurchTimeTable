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
  const initials = (profile.member?.firstName?.[0] ?? profile.email[0] ?? "?").toUpperCase();

  return (
    <header className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-xs)] lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CmmsButton
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 lg:hidden"
            onClick={onOpenMenu}
          >
            {t("shell.menu")}
          </CmmsButton>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CmmsBadge variant="neutral">{t(`shell.experience.${experience}`)}</CmmsBadge>
            </div>
            <h1 className="cmms-text-display mt-2 text-[var(--foreground)]">{title}</h1>
            <p className="cmms-text-body mt-1 max-w-2xl text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="hidden items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--surface-subtle)] px-3 py-1.5 sm:flex"
            title={profile.email}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
              {initials}
            </div>
            <span className="max-w-[140px] truncate text-sm font-medium text-[var(--foreground)]">
              {displayName || profile.email}
            </span>
          </div>
          <LocaleSwitcher />
          <ThemeToggle />
          <CmmsButton type="button" variant="secondary" size="sm" onClick={onLogout}>
            {t("common.logout")}
          </CmmsButton>
        </div>
      </div>
    </header>
  );
}
