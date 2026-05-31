"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  DashboardStateCard,
  DashboardStatCard,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import {
  downloadMinistryFinanceCsv,
  downloadMinistryFinancePdf,
  type FinanceTransactionRow,
} from "@/core/api/http";
import { OperationalScreen } from "@/components/ui/operational-screen";
import {
  useApproveFinanceTransactionMutation,
  useFinanceStewardshipQuery,
} from "@/features/finance/hooks/use-finance-stewardship";
import {
  canApproveFinanceForMinistry,
  hasChoirFinanceView,
  hasProtocolFinanceView,
} from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { getApiErrorMessage } from "@/core/api/errors";

type MinistryTab = "CHOIR" | "PROTOCOL";

function approvalVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

export function FinanceStewardshipDashboard() {
  const t = useTranslations("financeStewardship");
  const profile = useSessionStore((s) => s.profile);
  const perms = profile?.permissions ?? [];
  const canChoir = hasChoirFinanceView(perms);
  const canProtocol = hasProtocolFinanceView(perms);
  const defaultTab: MinistryTab = canProtocol && !canChoir ? "PROTOCOL" : "CHOIR";
  const [tab, setTab] = useState<MinistryTab>(defaultTab);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [exportDone, setExportDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useFinanceStewardshipQuery(
    canChoir && canProtocol ? tab : canProtocol ? "PROTOCOL" : "CHOIR",
    canChoir || canProtocol,
  );
  const approveMutation = useApproveFinanceTransactionMutation(
    canChoir && canProtocol ? tab : canProtocol ? "PROTOCOL" : "CHOIR",
  );

  const canApprove = canApproveFinanceForMinistry(perms, tab);

  const pendingTransactions = useMemo(
    () =>
      (query.data?.recentTransactions ?? []).filter(
        (row) => row.approvalStatus === "PENDING",
      ),
    [query.data?.recentTransactions],
  );

  if (!canChoir && !canProtocol) {
    return (
      <DashboardStateCard title={t("title")} message={t("unauthorized")} />
    );
  }

  if (query.isLoading) {
    return <DashboardStateCard title={t("title")} message={t("loading")} />;
  }

  if (query.isError || !query.data) {
    return <DashboardStateCard title={t("title")} message={t("loadError")} />;
  }

  const data = query.data;

  async function handleApproval(id: string, approve: boolean) {
    setActionError(null);
    try {
      await approveMutation.mutateAsync({ id, approve });
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("approvalFailed")));
    }
  }

  return (
    <OperationalScreen error={actionError}>
      <div className="flex flex-wrap items-center justify-end gap-2">
          <CmmsButton
            variant="secondary"
            disabled={!!exporting}
            onClick={async () => {
              setExporting("csv");
              setExportDone(false);
              try {
                await downloadMinistryFinanceCsv({ ministryScope: tab });
                setExportDone(true);
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === "csv" ? t("exporting") : t("exportCsv")}
          </CmmsButton>
          <CmmsButton
            variant="secondary"
            disabled={!!exporting}
            onClick={async () => {
              setExporting("pdf");
              setExportDone(false);
              try {
                await downloadMinistryFinancePdf({ ministryScope: tab });
                setExportDone(true);
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === "pdf" ? t("exporting") : t("exportPdf")}
          </CmmsButton>
          {exportDone ? (
            <span className="self-center text-sm text-[var(--success)]">{t("exportSuccess")}</span>
          ) : null}
      </div>

      {canChoir && canProtocol ? (
        <div className="flex flex-wrap gap-2">
          <CmmsButton
            variant={tab === "CHOIR" ? "primary" : "secondary"}
            onClick={() => setTab("CHOIR")}
          >
            {t("tabs.choir")}
          </CmmsButton>
          <CmmsButton
            variant={tab === "PROTOCOL" ? "primary" : "secondary"}
            onClick={() => setTab("PROTOCOL")}
          >
            {t("tabs.protocol")}
          </CmmsButton>
        </div>
      ) : null}

      {data.alerts.length > 0 ? (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <CmmsCard key={alert.id} title={alert.title}>
              <CmmsBadge
                variant={
                  alert.severity === "critical"
                    ? "danger"
                    : alert.severity === "warning"
                      ? "warning"
                      : "info"
                }
              >
                {alert.severity}
              </CmmsBadge>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{alert.message}</p>
            </CmmsCard>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard label={t("stats.balance")} value={formatCurrency(data.balance)} />
        <DashboardStatCard
          label={t("stats.compliance")}
          value={formatPercent(data.complianceRate)}
        />
        <DashboardStatCard
          label={t("stats.unpaid")}
          value={formatCurrency(data.unpaidBalance)}
          tone={data.unpaidBalance > 0 ? "warning" : "default"}
        />
        <DashboardStatCard label={t("stats.unpaidMembers")} value={data.unpaidMemberCount} />
        {data.contributions ? (
          <>
            <DashboardStatCard
              label={t("stats.contributionTotals")}
              value={formatCurrency(data.contributions.contributionTotals)}
            />
            <DashboardStatCard
              label={t("stats.pendingContributions")}
              value={data.contributions.pendingConfirmationCount}
              tone={
                data.contributions.pendingConfirmationCount > 0 ? "warning" : "default"
              }
            />
          </>
        ) : null}
      </div>

      {!data.executiveSummary && data.contributions?.confirmationQueue?.length ? (
        <CmmsCard
          title={t("contributionQueueTitle")}
          description={t("contributionQueueHint")}
        >
          <CmmsTable
            compact
            rows={data.contributions.confirmationQueue}
            columns={[
              {
                header: "Reference",
                render: (row) => row.referenceNumber,
              },
              {
                header: t("columns.member"),
                render: (row) => row.memberName ?? row.memberNumber ?? "—",
              },
              {
                header: t("columns.type"),
                render: (row) => row.contributionType,
              },
              {
                header: t("columns.amount"),
                render: (row) => formatCurrency(row.amount),
              },
              {
                header: t("columns.status"),
                render: (row) => row.status,
              },
            ]}
          />
        </CmmsCard>
      ) : null}

      {!data.executiveSummary && canApprove ? (
        <CmmsCard
          title={t("pendingApprovalsTitle")}
          description={t("pendingApprovalsHint")}
        >
          {pendingTransactions.length ? (
            <CmmsTable
              compact
              rows={pendingTransactions}
              columns={transactionColumns(t, canApprove, approveMutation.isPending, handleApproval)}
            />
          ) : (
            <CmmsEmptyState
              title={t("noPendingApprovals")}
              description={t("noPendingApprovalsHint")}
            />
          )}
        </CmmsCard>
      ) : null}

      {!data.executiveSummary ? (
        <CmmsCard title={t("recentTransactions")} description={t("recentTransactionsHint")}>
          {data.recentTransactions.length ? (
            <CmmsTable
              compact
              rows={data.recentTransactions}
              columns={transactionColumns(
                t,
                canApprove,
                approveMutation.isPending,
                handleApproval,
              )}
            />
          ) : (
            <CmmsEmptyState
              title={t("noTransactions")}
              description={t("noTransactionsHint")}
            />
          )}
        </CmmsCard>
      ) : null}

      <CmmsCard title={t("outstandingTitle")} description={t("outstandingHint")}>
        <CmmsTable
          rows={data.unpaidMembers}
          columns={[
            { key: "name", header: t("columns.member"), render: (r) => r.name },
            { key: "period", header: t("columns.period"), render: (r) => r.period },
            {
              key: "amount",
              header: t("columns.amountDue"),
              render: (r) => formatCurrency(r.amountDue),
            },
            { key: "status", header: t("columns.status"), render: (r) => r.status },
          ]}
          emptyState={
            <CmmsEmptyState
              title={t("noOutstanding")}
              description={t("noOutstandingHint")}
            />
          }
        />
      </CmmsCard>

      {data.budgets.length > 0 ? (
        <CmmsCard title={t("budgetsTitle")}>
          <ul className="space-y-2">
            {data.budgets.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <span>{b.name}</span>
                <span>
                  {formatCurrency(b.actual)} / {formatCurrency(b.planned)}
                  {b.overBudget ? (
                    <CmmsBadge variant="warning" className="ml-2">
                      {t("overBudget")}
                    </CmmsBadge>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </CmmsCard>
      ) : (
        <CmmsEmptyState
          title={t("noBudgetsTitle")}
          description={t("noBudgetsHint")}
        />
      )}
    </OperationalScreen>
  );
}

function transactionColumns(
  t: ReturnType<typeof useTranslations<"financeStewardship">>,
  canApprove: boolean,
  isPending: boolean,
  onApprove: (id: string, approve: boolean) => void,
) {
  return [
    {
      key: "date",
      header: t("columns.date"),
      render: (row: FinanceTransactionRow) =>
        new Date(String(row.transactionDate)).toLocaleDateString(),
    },
    {
      key: "type",
      header: t("columns.type"),
      render: (row: FinanceTransactionRow) => String(row.type),
    },
    {
      key: "amount",
      header: t("columns.amount"),
      render: (row: FinanceTransactionRow) => formatCurrency(Number(row.amount)),
    },
    {
      key: "status",
      header: t("columns.approval"),
      render: (row: FinanceTransactionRow) => (
        <CmmsBadge variant={approvalVariant(row.approvalStatus)}>
          {t(`approvalStatus.${row.approvalStatus}`)}
        </CmmsBadge>
      ),
    },
    ...(canApprove
      ? [
          {
            key: "actions",
            header: t("columns.actions"),
            render: (row: FinanceTransactionRow) =>
              row.approvalStatus === "PENDING" ? (
                <div className="flex flex-wrap gap-1">
                  <CmmsButton
                    size="sm"
                    variant="primary"
                    disabled={isPending}
                    onClick={() => void onApprove(row.id, true)}
                  >
                    {t("approve")}
                  </CmmsButton>
                  <CmmsButton
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => void onApprove(row.id, false)}
                  >
                    {t("reject")}
                  </CmmsButton>
                </div>
              ) : (
                <span className="text-[var(--muted-foreground)]">—</span>
              ),
          },
        ]
      : []),
  ];
}
