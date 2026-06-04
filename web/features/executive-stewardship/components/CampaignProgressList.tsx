"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import {
  formatCurrency,
  formatPercent,
  ProgressMeter,
} from "@/features/dashboard/components/dashboard-primitives";
import type { ChoirTotalsResponse } from "@/features/executive-stewardship/types";

const REPORTING_STATUSES = new Set(["ACTIVE", "COMPLETED"]);

export function CampaignProgressList({
  campaigns,
  compact = false,
}: Readonly<{
  campaigns: ChoirTotalsResponse["byCampaign"];
  compact?: boolean;
}>) {
  const t = useTranslations("executiveStewardship.campaigns");
  const visible = campaigns.filter((c) => REPORTING_STATUSES.has(c.status));

  if (!visible.length) {
    return <CmmsEmptyState title={t("emptyTitle")} description={t("emptyMessage")} />;
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {visible.map((campaign) => (
        <article key={campaign.campaignId} className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[var(--foreground)]">{campaign.name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("goal", { amount: formatCurrency(campaign.goalAmount) })}
              </p>
            </div>
            <CmmsBadge
              variant={campaign.status === "ACTIVE" ? "success" : "neutral"}
            >
              {campaign.status}
            </CmmsBadge>
          </div>
          <ProgressMeter
            label={t("progressLabel", {
              current: formatCurrency(campaign.confirmedEffective),
              pct: formatPercent(campaign.progressPct),
            })}
            value={campaign.progressPct}
          />
        </article>
      ))}
    </div>
  );
}
