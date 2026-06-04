"use client";

import { TopContributorsTable } from "@/features/executive-stewardship/components/TopContributorsTable";
import { StewardshipSubpageLayout } from "@/features/executive-stewardship/screens/stewardship-subpage";
import { useChoirRankingsQuery } from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipContributorsPage() {
  const query = useChoirRankingsQuery(true, 50);

  return (
    <StewardshipSubpageLayout
      titleKey="contributors"
      loading={query.isLoading}
      error={query.isError}
    >
      <TopContributorsTable contributors={query.data?.topContributors ?? []} />
    </StewardshipSubpageLayout>
  );
}
