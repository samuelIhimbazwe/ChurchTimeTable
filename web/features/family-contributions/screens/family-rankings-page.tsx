"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import {
  DashboardStateCard,
  formatCurrency,
} from "@/features/dashboard/components/dashboard-primitives";
import { FamilyContextPicker } from "@/features/family-contributions/components/FamilyContextPicker";
import { useFamilyRankingsQuery } from "@/features/family-contributions/hooks/use-family-contribution-queries";
import { useFamilyIdParam } from "@/features/family-contributions/lib/use-family-id-param";
import { useFamilyWorkspace } from "@/features/family-contributions/lib/use-family-workspace";

export function FamilyRankingsPage() {
  const t = useTranslations("familyContributions.rankings");
  const workspace = useFamilyWorkspace();
  useFamilyIdParam(workspace.setFamilyId);

  const { families, activeFamilyId, setFamilyId, contextQuery } = workspace;
  const rankingsQuery = useFamilyRankingsQuery(activeFamilyId);

  if (contextQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  return (
    <OperationalScreen className="cmms-content-wide">
      <p className="text-sm">
        <Link
          href={`/dashboard/family/contributions${activeFamilyId ? `?familyId=${activeFamilyId}` : ""}`}
          className="text-[var(--primary)] hover:underline"
        >
          {t("back")}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>

      <div className="mt-4">
        <FamilyContextPicker families={families} value={activeFamilyId} onChange={setFamilyId} />
      </div>

      {!activeFamilyId ? (
        <CmmsEmptyState className="mt-6" title={t("pickFamily")} />
      ) : rankingsQuery.isLoading ? (
        <div className="mt-6">
          <DashboardStateCard title={t("title")} message={t("loading")} />
        </div>
      ) : (
        <CmmsCard className="mt-6" title={t("contributorsTitle")}>
          <ul className="divide-y divide-[var(--border)]">
            {(rankingsQuery.data?.topContributors ?? []).map((row, index) => (
              <li
                key={row.memberId}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm">
                  <span className="mr-2 font-medium text-[var(--muted-foreground)]">
                    #{index + 1}
                  </span>
                  {row.memberName}
                </span>
                <span className="font-medium">{formatCurrency(row.effectiveTotal)}</span>
              </li>
            ))}
          </ul>
        </CmmsCard>
      )}
    </OperationalScreen>
  );
}
