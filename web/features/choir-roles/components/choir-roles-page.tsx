"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";

/** Custom choir roles management — wired to /choir/custom-roles API in follow-up UI pass. */
export function ChoirRolesPage() {
  const t = useTranslations("choirRoles");

  return (
    <div className="cmms-page-stack">
      <div>
        <h1 className="cmms-text-display text-[var(--foreground)]">{t("pageTitle")}</h1>
        <p className="cmms-text-body mt-1 text-[var(--muted-foreground)]">{t("pageSubtitle")}</p>
      </div>
      <CmmsCard className="p-6">
        <p className="text-sm text-[var(--muted-foreground)]">{t("manageHint")}</p>
      </CmmsCard>
    </div>
  );
}
