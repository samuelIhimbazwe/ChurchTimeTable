import { ProtectedRoute } from "@/components/auth/protected-route";
import { CommitteeGovernanceAdmin } from "@/features/governance/components/committee-governance-admin";

export default function GovernanceAdminPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "committee.member.manage",
        "committee.role.manage",
        "member:manage",
      ]}
    >
      <CommitteeGovernanceAdmin />
    </ProtectedRoute>
  );
}
