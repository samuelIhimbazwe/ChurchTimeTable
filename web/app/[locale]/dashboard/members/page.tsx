import { ProtectedRoute } from "@/components/auth/protected-route";
import { MembersDirectory } from "@/features/members/components/members-directory";

export default function MembersPage() {
  return (
    <ProtectedRoute requiredPermissions={["member:manage"]}>
      <MembersDirectory />
    </ProtectedRoute>
  );
}
