import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipFamiliesPage } from "@/features/executive-stewardship/screens/stewardship-families-page";

export default function StewardshipFamiliesRoute() {
  return (
    <StewardshipGuard>
      <StewardshipFamiliesPage />
    </StewardshipGuard>
  );
}
