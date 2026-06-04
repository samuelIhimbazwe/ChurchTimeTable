"use client";

import { NeedsAttentionList } from "@/features/executive-stewardship/components/NeedsAttentionList";
import { StewardshipSubpageLayout } from "@/features/executive-stewardship/screens/stewardship-subpage";
import { useChoirRankingsQuery } from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipNeedsAttentionPage() {
  const query = useChoirRankingsQuery(true, 50);

  return (
    <StewardshipSubpageLayout
      titleKey="needsAttention"
      loading={query.isLoading}
      error={query.isError}
    >
      <NeedsAttentionList items={query.data?.needsAttention ?? []} />
    </StewardshipSubpageLayout>
  );
}
