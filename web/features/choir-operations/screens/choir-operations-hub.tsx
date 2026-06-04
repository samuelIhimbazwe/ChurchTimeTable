"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import { useSessionStore } from "@/core/auth/session-store";
import { hasEffectivePermission } from "@/core/auth/governance-permissions";

const LINKS = [
  { href: "/dashboard/stewardship", perm: "choir.contribution.view.all", key: "stewardship" },
  { href: "/dashboard/family/contributions", perm: null, key: "family" },
  { href: "/dashboard/contributions", perm: "choir.contribution.submit", key: "contributions" },
  { href: "/dashboard/events", perm: "event:read", key: "events" },
  { href: "/dashboard/attendance", perm: "event:read", key: "attendance" },
  { href: "/dashboard/families", perm: "family:view", key: "families" },
] as const;

export function ChoirOperationsHubPage() {
  const t = useTranslations("choirOperations");
  const perms = useSessionStore((s) => s.profile?.permissions ?? []);

  const visible = LINKS.filter(
    (item) => !item.perm || hasEffectivePermission(perms, item.perm),
  );

  return (
    <OperationalScreen className="cmms-content-wide space-y-6">
      <header>
        <p className="text-sm text-[var(--muted-foreground)]">{t("eyebrow")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      <CmmsCard title={t("modulesTitle")}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="block rounded-[var(--radius-lg)] border border-[var(--border)] p-4 hover:border-[var(--primary)]"
              >
                <p className="font-medium">{t(`modules.${item.key}.title`)}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {t(`modules.${item.key}.description`)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </CmmsCard>

      <CmmsCard title={t("apiTitle")}>
        <p className="text-sm text-[var(--muted-foreground)]">{t("apiHint")}</p>
        <ul className="mt-3 list-inside list-disc text-sm">
          <li>{t("apiWelfare")}</li>
          <li>{t("apiMusic")}</li>
          <li>{t("apiRehearsals")}</li>
        </ul>
      </CmmsCard>
    </OperationalScreen>
  );
}
