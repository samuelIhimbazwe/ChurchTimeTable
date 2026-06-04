"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChoirSwitcher } from "@/components/layout/choir-switcher";
import type { DashboardExperience } from "@/core/auth/rbac";
import type { AuthProfile } from "@/core/api/types";

export function TopNav({
  title,
  subtitle,
  profile,
  experience,
  onOpenMenu,
  onLogout,
  searchPlaceholder,
  search,
  primaryAction,
}: Readonly<{
  title: string;
  subtitle: string;
  profile: AuthProfile;
  experience: DashboardExperience;
  onOpenMenu: () => void;
  onLogout: () => Promise<void> | void;
  searchPlaceholder?: string;
  search?: ReactNode;
  primaryAction?: { label: string; onClick: () => void };
}>) {
  const t = useTranslations();
  const displayName = [profile.member?.firstName, profile.member?.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = (profile.member?.firstName?.[0] ?? profile.email[0] ?? "?").toUpperCase();

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <CmmsButton type="button" variant="secondary" size="sm" onClick={onOpenMenu}>
          {t("shell.menu")}
        </CmmsButton>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
            {initials}
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-xs)] lg:px-6 lg:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CmmsBadge variant="info">{t(`shell.experience.${experience}`)}</CmmsBadge>
            </div>
            <h1 className="cmms-text-display mt-2 text-[var(--foreground)]">{title}</h1>
            <p className="cmms-text-body mt-1 max-w-2xl text-[var(--muted-foreground)]">{subtitle}</p>
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <ChoirSwitcher />
            <LocaleSwitcher />
            <ThemeToggle />
            <CmmsButton type="button" variant="secondary" size="sm" onClick={onLogout}>
              {t("common.logout")}
            </CmmsButton>
            {primaryAction ? (
              <CmmsButton type="button" size="sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </CmmsButton>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {search ?? (
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">{searchPlaceholder ?? t("shell.search")}</span>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="search"
                placeholder={searchPlaceholder ?? t("shell.search")}
                className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </label>
          )}
          <div
            className="hidden items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--surface-subtle)] px-3 py-1.5 lg:flex"
            title={profile.email}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
              {initials}
            </div>
            <span className="max-w-[140px] truncate text-sm font-medium text-[var(--foreground)]">
              {displayName || profile.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
