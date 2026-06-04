"use client";

import { useTranslations } from "next-intl";

import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import {
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import type { ChoirRankingsResponse } from "@/features/executive-stewardship/types";

export function TopFamiliesTable({
  families,
}: Readonly<{ families: ChoirRankingsResponse["topFamilies"] }>) {
  const t = useTranslations("executiveStewardship.families");

  if (!families.length) {
    return <CmmsEmptyState title={t("emptyTitle")} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="py-2 pr-3 font-medium">{t("rank")}</th>
            <th className="py-2 pr-3 font-medium">{t("family")}</th>
            <th className="py-2 pr-3 font-medium text-right">{t("effective")}</th>
            <th className="py-2 font-medium text-right">{t("goalPct")}</th>
          </tr>
        </thead>
        <tbody>
          {families.map((row, index) => (
            <tr key={row.familyId} className="border-b border-[var(--border)]/60">
              <td className="py-3 pr-3">{index + 1}</td>
              <td className="py-3 pr-3">
                <span className="font-medium">{row.familyName}</span>
                {row.familyCode ? (
                  <span className="ml-1 text-[var(--muted-foreground)]">
                    {row.familyCode}
                  </span>
                ) : null}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">
                {formatCurrency(row.effectiveTotal)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {row.goalProgressPct != null
                  ? formatPercent(row.goalProgressPct)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
