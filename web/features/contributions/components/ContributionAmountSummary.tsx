"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import type { MemberContributionRecord } from "@/features/contributions/types";

export function ContributionAmountSummary({
  record,
}: Readonly<{ record: MemberContributionRecord }>) {
  const t = useTranslations("contributions.amounts");

  const rows: Array<{ label: string; value: string; emphasize?: boolean }> = [
    {
      label: t("claimed"),
      value: formatCurrency(record.claimedAmount, record.currency),
    },
  ];

  if (record.confirmedAmount != null) {
    rows.push({
      label: t("confirmed"),
      value: formatCurrency(record.confirmedAmount, record.currency),
    });
  }

  if (
    record.adjustmentTotal != null &&
    record.adjustmentTotal !== 0 &&
    record.adjustments.length > 0
  ) {
    rows.push({
      label: t("adjustments"),
      value: formatCurrency(record.adjustmentTotal, record.currency),
    });
  }

  if (record.effectiveAmount != null && record.status === "CONFIRMED") {
    rows.push({
      label: t("effective"),
      value: formatCurrency(record.effectiveAmount, record.currency),
      emphasize: true,
    });
  }

  return (
    <CmmsCard title={t("title")}>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt className="text-[var(--muted-foreground)]">{row.label}</dt>
            <dd
              className={
                row.emphasize
                  ? "text-lg font-semibold text-[var(--foreground)]"
                  : "font-medium"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </CmmsCard>
  );
}
