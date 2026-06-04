"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { ContributionAmountSummary } from "@/features/contributions/components/ContributionAmountSummary";
import { ContributionDetailCard } from "@/features/contributions/components/ContributionDetailCard";
import { ContributionTimeline } from "@/features/contributions/components/ContributionTimeline";
import { ApproveContributionModal } from "@/features/family-contributions/components/ApproveContributionModal";
import { FamilyContextPicker } from "@/features/family-contributions/components/FamilyContextPicker";
import { RejectContributionModal } from "@/features/family-contributions/components/RejectContributionModal";
import {
  useFamilyContributionDetailQuery,
  useFamilyContributionTimelineQuery,
} from "@/features/family-contributions/hooks/use-family-contribution-queries";
import { useFamilyIdParam } from "@/features/family-contributions/lib/use-family-id-param";
import { useFamilyWorkspace } from "@/features/family-contributions/lib/use-family-workspace";

export function FamilyContributionDetailPage({
  contributionId,
}: Readonly<{ contributionId: string }>) {
  const t = useTranslations("familyContributions.detail");
  const workspace = useFamilyWorkspace();
  useFamilyIdParam(workspace.setFamilyId);

  const { families, activeFamilyId, activeFamily, setFamilyId } = workspace;
  const detailQuery = useFamilyContributionDetailQuery(contributionId);
  const timelineQuery = useFamilyContributionTimelineQuery(contributionId);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const familyId = activeFamilyId ?? detailQuery.data?.familyId ?? "";
  const canAct =
    activeFamily?.canApprove &&
    detailQuery.data?.status === "SUBMITTED" &&
    detailQuery.data.familyId === activeFamilyId;

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
      </OperationalScreen>
    );
  }

  const record = detailQuery.data;

  return (
    <OperationalScreen className="cmms-content-narrow">
      <p className="text-sm">
        <Link
          href={`/dashboard/family/contributions/pending?familyId=${familyId}`}
          className="text-[var(--primary)] hover:underline"
        >
          {t("backPending")}
        </Link>
      </p>

      {families.length > 1 ? (
        <div className="mt-4">
          <FamilyContextPicker
            families={families}
            value={activeFamilyId}
            onChange={setFamilyId}
          />
        </div>
      ) : null}

      {canAct ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <CmmsButton variant="primary" onClick={() => setApproveOpen(true)}>
            {t("approve")}
          </CmmsButton>
          <CmmsButton variant="danger" onClick={() => setRejectOpen(true)}>
            {t("reject")}
          </CmmsButton>
        </div>
      ) : activeFamily?.isViewOnly && record.status === "SUBMITTED" ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">{t("viewOnlyActions")}</p>
      ) : null}

      <div className="mt-6 space-y-6">
        <ContributionDetailCard record={record} />
        <ContributionAmountSummary record={record} />
        <ContributionTimeline
          events={timelineQuery.data?.events ?? []}
          isLoading={timelineQuery.isLoading}
        />
      </div>

      <ApproveContributionModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        record={record}
        familyId={familyId}
        onSuccess={() => detailQuery.refetch()}
      />
      <RejectContributionModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        record={record}
        familyId={familyId}
        onSuccess={() => detailQuery.refetch()}
      />
    </OperationalScreen>
  );
}
