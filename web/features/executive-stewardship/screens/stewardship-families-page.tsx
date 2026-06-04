"use client";

import { TopFamiliesTable } from "@/features/executive-stewardship/components/TopFamiliesTable";
import { StewardshipSubpageLayout } from "@/features/executive-stewardship/screens/stewardship-subpage";
import { useChoirRankingsQuery } from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipFamiliesPage() {
  const query = useChoirRankingsQuery(true, 50);

  return (
    <StewardshipSubpageLayout
      titleKey="families"
      loading={query.isLoading}
      error={query.isError}
    >
      <TopFamiliesTable families={query.data?.topFamilies ?? []} />
    </StewardshipSubpageLayout>
  );
}
