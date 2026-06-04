import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipAdjustmentsPage } from "@/features/executive-stewardship/screens/stewardship-adjustments-page";

export default function StewardshipAdjustmentsRoute() {
  return (
    <StewardshipGuard>
      <StewardshipAdjustmentsPage />
    </StewardshipGuard>
  );
}
