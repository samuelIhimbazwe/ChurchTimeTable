import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChurchIntelligencePage } from "@/features/church-intelligence/components/church-intelligence-page";

export default function ChurchReportsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["church.reports.view", "church.intelligence.view"]}
    >
      <ChurchIntelligencePage tab="reports" />
    </ProtectedRoute>
  );
}
