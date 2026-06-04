"use client";

import { useTranslations } from "next-intl";

import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import {
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import type { ChoirRankingsResponse } from "@/features/executive-stewardship/types";

const REASON_KEYS = [
  "pending_backlog",
  "low_goal_attainment",
  "no_activity",
] as const;

type ReasonKey = (typeof REASON_KEYS)[number];

function isReasonKey(reason: string): reason is ReasonKey {
  return (REASON_KEYS as readonly string[]).includes(reason);
}

export function NeedsAttentionList({
  items,
}: Readonly<{ items: ChoirRankingsResponse["needsAttention"] }>) {
  const t = useTranslations("executiveStewardship.needsAttention");

  if (!items.length) {
    return <CmmsEmptyState title={t("emptyTitle")} description={t("emptyMessage")} />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.familyId}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.familyName}</p>
              {item.familyCode ? (
                <p className="text-xs text-[var(--muted-foreground)]">{item.familyCode}</p>
              ) : null}
            </div>
            <p className="text-sm tabular-nums text-[var(--muted-foreground)]">
              {formatCurrency(item.effectiveTotal)}
            </p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted-foreground)]">
            {item.reasons.map((reason) => (
              <li key={reason}>
                {isReasonKey(reason) ? t(`reasons.${reason}`) : reason}
                {reason === "low_goal_attainment" && item.lowestCampaignProgressPct != null
                  ? ` (${formatPercent(item.lowestCampaignProgressPct)})`
                  : null}
                {reason === "pending_backlog" && item.pendingCount > 0
                  ? ` (${item.pendingCount})`
                  : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
