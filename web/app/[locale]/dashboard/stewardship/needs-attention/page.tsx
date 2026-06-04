import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipNeedsAttentionPage } from "@/features/executive-stewardship/screens/stewardship-needs-attention-page";

export default function StewardshipNeedsAttentionRoute() {
  return (
    <StewardshipGuard>
      <StewardshipNeedsAttentionPage />
    </StewardshipGuard>
  );
}
