"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import type { RecentAdjustmentItem } from "@/features/executive-stewardship/types";

function categoryVariant(
  category: RecentAdjustmentItem["category"],
): "danger" | "success" | "warning" | "neutral" {
  if (category === "CORRECTION") return "danger";
  if (category === "TRANSFER") return "success";
  if (category === "REVERSAL") return "warning";
  return "neutral";
}

export function RecentAdjustmentsList({
  items,
}: Readonly<{ items: RecentAdjustmentItem[] }>) {
  const t = useTranslations("executiveStewardship.adjustments");

  if (!items.length) {
    return <CmmsEmptyState title={t("emptyTitle")} description={t("emptyMessage")} />;
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <li key={item.adjustmentId} className="flex flex-wrap gap-3 py-4 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/contributions/${item.contributionId}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {item.memberName}
              </Link>
              {item.memberNumber ? (
                <span className="text-xs text-[var(--muted-foreground)]">
                  {item.memberNumber}
                </span>
              ) : null}
              <CmmsBadge variant={categoryVariant(item.category)}>
                {t(`categories.${item.category}`)}
              </CmmsBadge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {[item.familyName, item.campaignName, item.referenceNumber]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-1 text-sm">{item.reason}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p
            className={`text-sm font-semibold tabular-nums ${
              item.adjustmentAmount < 0
                ? "text-[var(--danger)]"
                : "text-[var(--success)]"
            }`}
          >
            {item.adjustmentAmount < 0 ? "−" : "+"}
            {formatCurrency(Math.abs(item.adjustmentAmount))}
          </p>
        </li>
      ))}
    </ul>
  );
}
