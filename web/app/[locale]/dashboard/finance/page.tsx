import { ProtectedRoute } from "@/components/auth/protected-route";
import { FINANCE_ACCESS_PERMISSIONS } from "@/core/auth/governance-permissions";
import { FinanceStewardshipDashboard } from "@/features/finance/components/finance-stewardship-dashboard";

export default function FinanceStewardshipPage() {
  return (
    <ProtectedRoute requiredPermissions={[...FINANCE_ACCESS_PERMISSIONS]}>
      <FinanceStewardshipDashboard />
    </ProtectedRoute>
  );
}
