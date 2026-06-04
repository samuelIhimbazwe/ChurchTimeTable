"use client";

import { useTranslations } from "next-intl";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { useRouter } from "@/i18n/routing";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { ContributionForm } from "@/features/contributions/components/ContributionForm";
import {
  useSubmitContributionMutation,
  useSubmitOptionsQuery,
} from "@/features/contributions/hooks/use-contribution-queries";

export function ContributionNewPage() {
  const t = useTranslations("contributions.form");
  const router = useRouter();
  const optionsQuery = useSubmitOptionsQuery();
  const submitMutation = useSubmitContributionMutation();

  if (optionsQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("loadingOptions")} />
      </OperationalScreen>
    );
  }

  if (optionsQuery.isError || !optionsQuery.data) {
    return (
      <OperationalScreen className="cmms-content-narrow">
        <DashboardStateCard title={t("title")} message={t("loadOptionsError")} />
      </OperationalScreen>
    );
  }

  return (
    <OperationalScreen className="cmms-content-narrow">
      <ContributionForm
        types={optionsQuery.data.types}
        campaigns={optionsQuery.data.campaigns}
        submitting={submitMutation.isPending}
        onCancel={() => router.push("/dashboard/contributions")}
        onSubmit={async (values) => {
          const created = await submitMutation.mutateAsync(values);
          router.push(`/dashboard/contributions/${created.id}`);
        }}
      />
    </OperationalScreen>
  );
}
