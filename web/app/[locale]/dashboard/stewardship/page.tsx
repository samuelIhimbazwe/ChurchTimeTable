import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipHubPage } from "@/features/executive-stewardship/screens/stewardship-hub";

export default function ExecutiveStewardshipRoute() {
  return (
    <StewardshipGuard>
      <StewardshipHubPage />
    </StewardshipGuard>
  );
}
