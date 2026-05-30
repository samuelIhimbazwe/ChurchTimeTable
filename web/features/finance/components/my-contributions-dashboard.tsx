"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link, useRouter } from "@/i18n/routing";
import {
  DashboardStateCard,
  DashboardStatCard,
  ProgressMeter,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { useMyContributionsQuery } from "@/features/finance/hooks/use-finance-stewardship";
import {
  downloadMemberContributionsCsv,
  downloadMemberContributionsPdf,
  type MyContributionsPayload,
} from "@/core/api/http";

function statusVariant(
  status: string,
): "success" | "warning" | "info" | "danger" | "neutral" {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIAL":
      return "warning";
    case "WAIVED":
      return "info";
    case "UNPAID":
      return "danger";
    default:
      return "neutral";
  }
}

export function MyContributionsDashboard() {
  const t = useTranslations("myContributions");
  const router = useRouter();
  const query = useMyContributionsQuery();
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [exportDone, setExportDone] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <DashboardStateCard title={t("title")} message={t("loading")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[var(--radius-xl)] bg-[var(--surface-subtle)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <DashboardStateCard title={t("title")} message={t("loadError")} />;
  }

  const data = query.data as MyContributionsPayload;
  const { summary, byMinistry, history, reminders } = data;
  const isEmpty = history.length === 0 && reminders.length === 0;

  async function handleExport(kind: "csv" | "pdf") {
    setExporting(kind);
    setExportDone(false);
    try {
      if (kind === "csv") await downloadMemberContributionsCsv();
      else await downloadMemberContributionsPdf();
      setExportDone(true);
    } finally {
      setExporting(null);
    }
  }

  return (
    <OperationalScreen
      title={t("title")}
      subtitle={t("subtitle")}
      className="cmms-content-narrow"
    >
        <div className="flex flex-wrap gap-2">
          <CmmsButton
            variant="secondary"
            disabled={!!exporting}
            onClick={() => handleExport("csv")}
          >
            {exporting === "csv" ? t("exporting") : t("exportCsv")}
          </CmmsButton>
          <CmmsButton
            variant="secondary"
            disabled={!!exporting}
            onClick={() => handleExport("pdf")}
          >
            {exporting === "pdf" ? t("exporting") : t("exportPdf")}
          </CmmsButton>
          {exportDone ? (
            <span className="self-center text-sm text-[var(--success)]">{t("exportSuccess")}</span>
          ) : null}
        </div>

      {summary.upToDate ? (
        <CmmsCard title={t("upToDateTitle")}>
          <p className="text-sm text-[var(--muted-foreground)]">{t("upToDateMessage")}</p>
        </CmmsCard>
      ) : null}

      {isEmpty ? (
        <CmmsEmptyState
          title={t("emptyTitle")}
          description={t("emptyMessage")}
          actionLabel={t("backToDashboard")}
          onAction={() => router.push("/dashboard")}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardStatCard
              label={t("stats.contributed")}
              value={formatCurrency(summary.totalContributed)}
              tone="accent"
            />
            <DashboardStatCard
              label={t("stats.outstanding")}
              value={formatCurrency(summary.outstandingBalance)}
              tone={summary.outstandingBalance > 0 ? "warning" : "default"}
            />
          </div>

          <CmmsCard title={t("consistencyTitle")} description={t("consistencyHint")}>
            <ProgressMeter
              label={t("consistencyLabel")}
              value={summary.consistencyRate}
              description={t("consistencyDescription", {
                paid: summary.paidCount,
                total: summary.totalObligations,
              })}
            />
          </CmmsCard>

          {byMinistry.length > 0 ? (
            <CmmsCard title={t("ministryTitle")} description={t("ministryHint")}>
              <ul className="space-y-3">
                {byMinistry.map((m) => (
                  <li
                    key={m.ministryScope}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] px-4 py-3 text-sm"
                  >
                    <span className="font-medium">
                      {t(`ministry.${m.ministryScope.toLowerCase()}`)}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {formatCurrency(m.contributed)}
                      {m.outstanding > 0
                        ? ` · ${t("ministryOutstanding", { amount: formatCurrency(m.outstanding) })}`
                        : ` · ${t("ministryClear")}`}
                    </span>
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : null}

          {reminders.length > 0 ? (
            <CmmsCard title={t("remindersTitle")} description={t("remindersHint")}>
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{r.period}</p>
                      <p className="text-[var(--muted-foreground)]">
                        {t(`ministry.${r.ministryScope.toLowerCase()}`)} · {r.dueType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(r.remaining)}</span>
                      <CmmsBadge variant={statusVariant(r.status)}>
                        {t(`status.${r.status.toLowerCase()}`)}
                      </CmmsBadge>
                    </div>
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : null}

          <CmmsCard title={t("historyTitle")} description={t("historyHint")}>
            {history.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("noHistory")}</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {history.map((item) => (
                  <li
                    key={`${item.id}-${item.date}`}
                    className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {item.period ?? item.contributionType}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {item.date} · {t(`ministry.${item.ministryScope.toLowerCase()}`)}
                      </p>
                      {item.receiptUrl ? (
                        <a
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm text-[var(--primary)] hover:underline"
                        >
                          {t("viewReceipt")}
                        </a>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.amount)}</p>
                      <CmmsBadge variant={statusVariant(item.status)} className="mt-1">
                        {t(`status.${item.status.toLowerCase()}`)}
                      </CmmsBadge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CmmsCard>
        </>
      )}

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/dashboard" className="text-[var(--primary)] hover:underline">
          {t("backToDashboard")}
        </Link>
      </p>
    </OperationalScreen>
  );
}
