import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolDashboardPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["protocol.view", "protocol.manage"]}
    >
      <ProtocolPage tab="overview" />
    </ProtectedRoute>
  );
}
