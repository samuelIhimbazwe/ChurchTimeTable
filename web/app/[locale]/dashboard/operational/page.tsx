import { ProtectedRoute } from "@/components/auth/protected-route";
import { OperationalDashboard } from "@/features/dashboard/components/operational-dashboard";

export default function OperationalDashboardPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "protocol.oversight",
        "protocol.team.manage",
        "protocol.team.head",
        "protocol.operational.monitor",
        "choir.oversight",
        "choir.operations.manage",
        "choir.attendance.manage",
      ]}
    >
      <OperationalDashboard />
    </ProtectedRoute>
  );
}
