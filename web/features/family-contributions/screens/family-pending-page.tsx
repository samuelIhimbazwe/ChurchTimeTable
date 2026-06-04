"use client";

import { useTranslations } from "next-intl";

import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { FamilyContextPicker } from "@/features/family-contributions/components/FamilyContextPicker";
import { FamilyPendingTable } from "@/features/family-contributions/components/FamilyPendingTable";
import { useFamilyInboxQuery } from "@/features/family-contributions/hooks/use-family-contribution-queries";
import { useFamilyIdParam } from "@/features/family-contributions/lib/use-family-id-param";
import { useFamilyWorkspace } from "@/features/family-contributions/lib/use-family-workspace";

export function FamilyPendingPage() {
  const t = useTranslations("familyContributions.pending");
  const workspace = useFamilyWorkspace();
  useFamilyIdParam(workspace.setFamilyId);

  const { families, activeFamilyId, activeFamily, setFamilyId, contextQuery } = workspace;
  const inboxQuery = useFamilyInboxQuery(activeFamilyId, "SUBMITTED");

  if (contextQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  if (contextQuery.isError || !families.length) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <CmmsEmptyState title={t("noAccessTitle")} description={t("noAccessMessage")} />
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
      {activeFamily?.isViewOnly ? (
        <p className="mt-1 text-sm text-[var(--warning)]">{t("viewOnly")}</p>
      ) : null}

      <div className="mt-4">
        <FamilyContextPicker families={families} value={activeFamilyId} onChange={setFamilyId} />
      </div>

      {!activeFamilyId ? (
        <CmmsEmptyState className="mt-6" title={t("pickFamily")} />
      ) : inboxQuery.isLoading ? (
        <div className="mt-6">
          <DashboardStateCard title={t("title")} message={t("loading")} />
        </div>
      ) : (
        <div className="mt-6">
          <FamilyPendingTable familyId={activeFamilyId} items={inboxQuery.data?.items ?? []} />
        </div>
      )}
    </OperationalScreen>
  );
}
