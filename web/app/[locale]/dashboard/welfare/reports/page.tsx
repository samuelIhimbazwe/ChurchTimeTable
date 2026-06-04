import { ProtectedRoute } from "@/components/auth/protected-route";
import { WelfareReportsPage } from "@/features/welfare/components/welfare-reports-page";

export default function WelfareReportsRoutePage() {
  return (
    <ProtectedRoute
      requiredPermissions={["choir.welfare.view", "choir.welfare.manage"]}
    >
      <WelfareReportsPage />
    </ProtectedRoute>
  );
}
