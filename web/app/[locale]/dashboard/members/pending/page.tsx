import { ProtectedRoute } from "@/components/auth/protected-route";
import { PendingMembersQueue } from "@/features/members/components/pending-members-queue";

export default function PendingMembersPage() {
  return (
    <ProtectedRoute requiredPermissions={["member:manage"]}>
      <PendingMembersQueue />
    </ProtectedRoute>
  );
}
