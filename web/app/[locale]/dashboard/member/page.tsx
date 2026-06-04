import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChurchMemberPortalDashboard } from "@/features/member-portal/components/church-member-portal-dashboard";

export default function MemberPortalDashboardPage() {
  return (
    <ProtectedRoute>
      <ChurchMemberPortalDashboard />
    </ProtectedRoute>
  );
}
