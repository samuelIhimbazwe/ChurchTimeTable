"use client";

import { useTranslations } from "next-intl";

import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import type { ChoirRankingsResponse } from "@/features/executive-stewardship/types";

export function TopContributorsTable({
  contributors,
}: Readonly<{ contributors: ChoirRankingsResponse["topContributors"] }>) {
  const t = useTranslations("executiveStewardship.contributors");

  if (!contributors.length) {
    return <CmmsEmptyState title={t("emptyTitle")} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="py-2 pr-3 font-medium">{t("rank")}</th>
            <th className="py-2 pr-3 font-medium">{t("contributor")}</th>
            <th className="py-2 pr-3 font-medium">{t("family")}</th>
            <th className="py-2 font-medium text-right">{t("effective")}</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map((row, index) => (
            <tr key={row.memberId} className="border-b border-[var(--border)]/60">
              <td className="py-3 pr-3">{index + 1}</td>
              <td className="py-3 pr-3">
                <p className="font-medium">{row.memberName}</p>
                {row.memberNumber ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {row.memberNumber}
                  </p>
                ) : null}
              </td>
              <td className="py-3 pr-3 text-[var(--muted-foreground)]">
                {row.familyName ?? "—"}
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatCurrency(row.effectiveTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
