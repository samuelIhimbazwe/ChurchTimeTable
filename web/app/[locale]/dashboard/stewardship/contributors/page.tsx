import { StewardshipGuard } from "@/features/executive-stewardship/components/StewardshipGuard";
import { StewardshipContributorsPage } from "@/features/executive-stewardship/screens/stewardship-contributors-page";

export default function StewardshipContributorsRoute() {
  return (
    <StewardshipGuard>
      <StewardshipContributorsPage />
    </StewardshipGuard>
  );
}
