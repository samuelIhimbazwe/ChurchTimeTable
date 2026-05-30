"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { DashboardStatCard, formatPercent } from "@/features/dashboard/components/dashboard-primitives";
import type { DashboardStatItem } from "@/core/api/types";

export function MinistryIntelligencePanel({ items }: { items: DashboardStatItem[] }) {
  const t = useTranslations("dashboard.intelligence");

  if (!items.length) return null;

  return (
    <CmmsCard title={t("title")} description={t("description")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4 space-y-3"
          >
            <p className="font-medium text-[var(--foreground)]">
              {t(`ministries.${item.label.toLowerCase()}`)}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">{t("activeMembers")}</p>
                <p className="font-semibold">{item.count}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">{t("attendanceRate")}</p>
                <p className="font-semibold">{formatPercent(item.attendanceRate ?? null)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">{t("pendingReplacements")}</p>
                <p className="font-semibold">{item.pendingReplacements ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">{t("trend")}</p>
                <p className="font-semibold">
                  {item.trendDirection ? t(`trendDirection.${item.trendDirection}`) : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CmmsCard>
  );
}

export function MinistryHealthBadge({
  score,
  band,
}: {
  score: number;
  band: "excellent" | "good" | "attention";
}) {
  const t = useTranslations("dashboard.intelligence");
  return (
    <DashboardStatCard
      label={t("ministryHealth")}
      value={`${score}%`}
      description={t(`healthBand.${band}`)}
      tone={band === "attention" ? "warning" : "accent"}
    />
  );
}
