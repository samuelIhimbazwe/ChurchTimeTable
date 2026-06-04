"use client";

import { RecentAdjustmentsList } from "@/features/executive-stewardship/components/RecentAdjustmentsList";
import { StewardshipSubpageLayout } from "@/features/executive-stewardship/screens/stewardship-subpage";
import { useRecentAdjustmentsQuery } from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipAdjustmentsPage() {
  const query = useRecentAdjustmentsQuery(true, 50);

  return (
    <StewardshipSubpageLayout
      titleKey="adjustments"
      loading={query.isLoading}
      error={query.isError}
    >
      <RecentAdjustmentsList items={query.data?.items ?? []} />
    </StewardshipSubpageLayout>
  );
}
