"use client";

import { useTranslations } from "next-intl";

import { useChurchBranding } from "@/core/branding/church-branding-context";
import { NavIcon } from "@/components/layout/nav-icons";

type ChurchBrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function ChurchBrandMark({ compact = false, className }: ChurchBrandMarkProps) {
  const t = useTranslations();
  const { branding } = useChurchBranding();
  const churchName = branding?.churchName ?? t("app.nameShort");
  const tagline = compact ? null : (branding?.welcomeMessage ?? t("app.taglineShort"));

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {branding?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-[var(--radius-lg)] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-muted)] text-[var(--primary)]">
            <NavIcon name="governance" className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-[var(--foreground)]">
            {churchName}
          </p>
          {tagline ? (
            <p className="truncate text-xs text-[var(--muted-foreground)]">{tagline}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
