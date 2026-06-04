import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipCampaignsPage } from "@/features/executive-stewardship/screens/stewardship-campaigns-page";

export default function StewardshipCampaignsRoute() {
  return (
    <StewardshipGuard>
      <StewardshipCampaignsPage />
    </StewardshipGuard>
  );
}
