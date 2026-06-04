"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchMinistryBudgets,
  fetchMinistryExpenses,
  fetchMinistryFinanceSummary,
  fetchMinistryFunds,
} from "@/features/ministry-finance/api/ministry-finance-api";

type FinanceTab = "overview" | "funds" | "budgets" | "expenses" | "reports";

const TABS: FinanceTab[] = ["overview", "funds", "budgets", "expenses", "reports"];

export function MinistryFinancePage({ ministryId }: { ministryId: string }) {
  const summaryQuery = useQuery({
    queryKey: ["ministry-finance", ministryId, "summary"],
    queryFn: () => fetchMinistryFinanceSummary(ministryId),
  });

  const fundsQuery = useQuery({
    queryKey: ["ministry-finance", ministryId, "funds"],
    queryFn: () => fetchMinistryFunds(ministryId),
  });

  const budgetsQuery = useQuery({
    queryKey: ["ministry-finance", ministryId, "budgets"],
    queryFn: () => fetchMinistryBudgets(ministryId),
  });

  const expensesQuery = useQuery({
    queryKey: ["ministry-finance", ministryId, "expenses"],
    queryFn: () => fetchMinistryExpenses(ministryId),
  });

  const summary = summaryQuery.data;

  return (
    <OperationalScreen
      title="Ministry finance"
      description="Funds, budgets, and expenses — separate from choir contributions"
    >
      <Link
        href={`/dashboard/ministries/${ministryId}`}
        className="mb-4 inline-block text-sm text-primary underline"
      >
        ← Ministry overview
      </Link>

      <nav className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {TABS.map((t) => (
          <span key={t} className="rounded border px-2 py-1">
            {t}
          </span>
        ))}
      </nav>

      {summaryQuery.isLoading && <DashboardStateCard title="Loading finance…" />}
      {summaryQuery.error && (
        <DashboardStateCard title="Finance unavailable" variant="error" />
      )}

      {summary && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 font-semibold">Overview</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Total fund balance</dt>
                <dd>{summary.totalFundBalance.toLocaleString()} RWF</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Active budgets</dt>
                <dd>{summary.activeBudgets}</dd>
              </div>
            </dl>
            {summary.alerts.length > 0 && (
              <p className="mt-2 text-sm text-amber-700">
                {summary.alerts.length} balance alert(s)
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Funds</h2>
            {fundsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No funds yet.</p>
            )}
            <ul className="divide-y rounded-lg border">
              {(fundsQuery.data ?? summary.fundBalances).map((f) => (
                <li key={f.id} className="px-4 py-2 text-sm">
                  {f.name} · {(f.balance ?? 0).toLocaleString()} RWF
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Budgets</h2>
            {budgetsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No budgets yet.</p>
            )}
            <ul className="divide-y rounded-lg border">
              {(budgetsQuery.data ?? []).map((b) => (
                <li key={b.id} className="px-4 py-2 text-sm">
                  {b.name} ({b.fiscalYear}) — {b.status}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Recent expenses</h2>
            {expensesQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            )}
            <ul className="divide-y rounded-lg border">
              {(expensesQuery.data ?? summary.recentExpenses).map((e) => (
                <li key={e.id} className="px-4 py-2 text-sm">
                  {e.description} — {e.status} · {e.fund?.name}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Reports</h2>
            <p className="text-sm text-muted-foreground">
              Export via API:{" "}
              <code>/ministries/{ministryId}/finance/reports/export?format=csv</code>
            </p>
          </section>
        </div>
      )}
    </OperationalScreen>
  );
}
