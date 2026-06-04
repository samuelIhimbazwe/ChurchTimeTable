import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolMembersPage() {
  return (
    <ProtectedRoute requiredPermissions={["protocol.view", "protocol.manage"]}>
      <ProtocolPage tab="members" />
    </ProtectedRoute>
  );
}
