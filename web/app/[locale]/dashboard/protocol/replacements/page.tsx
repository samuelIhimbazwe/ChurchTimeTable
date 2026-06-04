import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProtocolPage } from "@/features/protocol/components/protocol-page";

export default function ProtocolReplacementsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["protocol.replacement.manage", "protocol.manage"]}
    >
      <ProtocolPage tab="replacements" />
    </ProtectedRoute>
  );
}
