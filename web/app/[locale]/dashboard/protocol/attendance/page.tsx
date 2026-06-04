import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolAttendancePage() {
  return (
    <ProtectedRoute
      requiredPermissions={["protocol.view", "protocol.attendance.manage"]}
    >
      <ProtocolPage tab="attendance" />
    </ProtectedRoute>
  );
}
