import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChurchIntelligencePage } from "@/features/church-intelligence/components/church-intelligence-page";

export default function ChurchAlertsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "church.governance.view",
        "church.intelligence.view",
      ]}
    >
      <ChurchIntelligencePage tab="alerts" />
    </ProtectedRoute>
  );
}
