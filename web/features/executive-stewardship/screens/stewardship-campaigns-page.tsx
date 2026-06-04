"use client";

import { CampaignProgressList } from "@/features/executive-stewardship/components/CampaignProgressList";
import { StewardshipSubpageLayout } from "@/features/executive-stewardship/screens/stewardship-subpage";
import { useChoirTotalsQuery } from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipCampaignsPage() {
  const query = useChoirTotalsQuery();

  return (
    <StewardshipSubpageLayout
      titleKey="campaigns"
      loading={query.isLoading}
      error={query.isError}
    >
      <CampaignProgressList campaigns={query.data?.byCampaign ?? []} />
    </StewardshipSubpageLayout>
  );
}
