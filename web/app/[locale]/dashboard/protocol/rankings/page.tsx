import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolRankingsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["protocol.ranking.view", "protocol.manage"]}
    >
      <ProtocolPage tab="rankings" />
    </ProtectedRoute>
  );
}
