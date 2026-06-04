"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { hasEffectivePermission } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { Link, useRouter } from "@/i18n/routing";
import {
  DashboardStatCard,
  DashboardStateCard,
  formatCurrency,
} from "@/features/dashboard/components/dashboard-primitives";
import { ContributionFilters } from "@/features/contributions/components/ContributionFilters";
import { ContributionTable } from "@/features/contributions/components/ContributionTable";
import {
  useMyContributionsQuery,
  usePersonalContributionTotalsQuery,
  useSubmitOptionsQuery,
} from "@/features/contributions/hooks/use-contribution-queries";
import type { ContributionStatus } from "@/features/contributions/types";

const SUBMIT_PERMISSION = "choir.contribution.submit";

export function ContributionsListPage() {
  const t = useTranslations("contributions");
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);
  const canSubmit = hasEffectivePermission(profile?.permissions ?? [], SUBMIT_PERMISSION);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "ALL" as ContributionStatus | "ALL",
    contributionTypeCatalogId: "",
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters.contributionTypeCatalogId
        ? { contributionTypeCatalogId: filters.contributionTypeCatalogId }
        : {}),
    }),
    [page, filters],
  );

  const listQuery = useMyContributionsQuery(queryParams);
  const totalsQuery = usePersonalContributionTotalsQuery();
  const optionsQuery = useSubmitOptionsQuery(canSubmit);

  const typeOptions = useMemo(() => {
    const fromOptions = optionsQuery.data?.types ?? [];
    const fromItems = listQuery.data?.items ?? [];
    const map = new Map<string, string>();
    for (const type of fromOptions) {
      map.set(type.id, type.name);
    }
    for (const item of fromItems) {
      if (item.contributionTypeCatalogId && item.typeName) {
        map.set(item.contributionTypeCatalogId, item.typeName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [optionsQuery.data?.types, listQuery.data?.items]);

  if (listQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  if (listQuery.isError || !listQuery.data) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("loadError")} />
      </OperationalScreen>
    );
  }

  const { items, meta, summary } = listQuery.data;
  const personalTotals = totalsQuery.data;

  return (
    <OperationalScreen className="cmms-content-wide">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{t("eyebrow")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
        </div>
        {canSubmit ? (
          <Link
            href="/dashboard/contributions/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] hover:opacity-95"
          >
            {t("submitNew")}
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label={t("stats.confirmedTotal")}
          value={formatCurrency(
            personalTotals?.confirmed.effectiveTotal ?? summary.confirmedEffectiveTotal,
          )}
          tone="accent"
        />
        <DashboardStatCard
          label={t("stats.pendingTotal")}
          value={formatCurrency(
            personalTotals?.pending.claimedTotal ?? summary.pendingClaimedTotal,
          )}
          tone="warning"
        />
        <DashboardStatCard
          label={t("stats.confirmedCount")}
          value={summary.confirmedCount}
        />
        <DashboardStatCard
          label={t("stats.pendingCount")}
          value={summary.pendingCount}
        />
      </div>

      <div className="mt-6 space-y-4">
        <ContributionFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          typeOptions={typeOptions}
        />

        {items.length === 0 ? (
          <CmmsEmptyState
            title={t("emptyTitle")}
            description={t("emptyMessage")}
            actionLabel={canSubmit ? t("submitNew") : undefined}
            onAction={
              canSubmit ? () => router.push("/dashboard/contributions/new") : undefined
            }
          />
        ) : (
          <>
            <ContributionTable items={items} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-[var(--muted-foreground)]">
                {t("pagination", {
                  page: meta.page,
                  totalPages: meta.totalPages,
                  total: meta.total,
                })}
              </p>
              <div className="flex gap-2">
                <CmmsButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("prevPage")}
                </CmmsButton>
                <CmmsButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("nextPage")}
                </CmmsButton>
              </div>
            </div>
          </>
        )}
      </div>
    </OperationalScreen>
  );
}
