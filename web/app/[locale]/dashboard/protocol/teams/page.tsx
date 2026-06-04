import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolTeamsPage() {
  return (
    <ProtectedRoute requiredPermissions={["protocol.view", "protocol.manage"]}>
      <ProtocolPage tab="teams" />
    </ProtectedRoute>
  );
}
