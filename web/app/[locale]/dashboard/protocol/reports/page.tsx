import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolReportsPage() {
  return (
    <ProtectedRoute requiredPermissions={["protocol.report", "protocol.manage"]}>
      <ProtocolPage tab="reports" />
    </ProtectedRoute>
  );
}
