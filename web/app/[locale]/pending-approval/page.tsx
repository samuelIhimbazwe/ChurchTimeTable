import { ProtectedRoute } from "@/components/auth/protected-route";
import { PendingApprovalScreen } from "@/features/auth/components/pending-approval-screen";

export default function PendingApprovalPage() {
  return (
    <ProtectedRoute allowPending>
      <PendingApprovalScreen />
    </ProtectedRoute>
  );
}
