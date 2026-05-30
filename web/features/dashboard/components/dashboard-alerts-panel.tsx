"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import type { MinistryAlert } from "@/core/api/types";

const severityVariant: Record<
  MinistryAlert["severity"],
  "danger" | "warning" | "info" | "neutral"
> = {
  critical: "danger",
  warning: "warning",
  info: "info",
};

export function DashboardAlertsPanel({ alerts }: { alerts: MinistryAlert[] }) {
  const t = useTranslations("dashboard.alerts");

  if (!alerts.length) {
    return null;
  }

  return (
    <CmmsCard title={t("title")} description={t("description")}>
      <div className="space-y-3">
        {alerts.slice(0, 6).map((alert) => (
          <div
            key={alert.id}
            className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-[var(--foreground)]">{alert.title}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {alert.message}
                </p>
                {alert.actionHint ? (
                  <p className="mt-2 text-sm text-[var(--muted-foreground)] italic">
                    {alert.actionHint}
                  </p>
                ) : null}
              </div>
              <CmmsBadge variant={severityVariant[alert.severity]}>
                {t(`severity.${alert.severity}`)}
              </CmmsBadge>
            </div>
          </div>
        ))}
      </div>
    </CmmsCard>
  );
}
