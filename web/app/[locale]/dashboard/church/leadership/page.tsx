import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChurchIntelligencePage } from "@/features/church-intelligence/components/church-intelligence-page";

export default function ChurchLeadershipPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "church.intelligence.view",
        "church.governance.view",
      ]}
    >
      <ChurchIntelligencePage tab="leadership" />
    </ProtectedRoute>
  );
}
