"use client";

import { useTranslations } from "next-intl";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { ContributionAmountSummary } from "@/features/contributions/components/ContributionAmountSummary";
import { ContributionDetailCard } from "@/features/contributions/components/ContributionDetailCard";
import { ContributionTimeline } from "@/features/contributions/components/ContributionTimeline";
import {
  useContributionDetailQuery,
  useContributionTimelineQuery,
} from "@/features/contributions/hooks/use-contribution-queries";

export function ContributionDetailPage({
  contributionId,
}: Readonly<{ contributionId: string }>) {
  const t = useTranslations("contributions.detail");
  const detailQuery = useContributionDetailQuery(contributionId);
  const timelineQuery = useContributionTimelineQuery(contributionId);

  if (detailQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("notFound")} />
        <p className="mt-4 text-center text-sm">
          <Link href="/dashboard/contributions" className="text-[var(--primary)] hover:underline">
            {t("backToList")}
          </Link>
        </p>
      </OperationalScreen>
    );
  }

  const record = detailQuery.data;

  return (
    <OperationalScreen className="cmms-content-narrow">
      <p className="text-sm">
        <Link href="/dashboard/contributions" className="text-[var(--primary)] hover:underline">
          {t("backToList")}
        </Link>
      </p>

      <div className="mt-4 space-y-6">
        <ContributionDetailCard record={record} />
        <ContributionAmountSummary record={record} />
        <ContributionTimeline
          events={timelineQuery.data?.events ?? []}
          isLoading={timelineQuery.isLoading}
        />
      </div>
    </OperationalScreen>
  );
}
