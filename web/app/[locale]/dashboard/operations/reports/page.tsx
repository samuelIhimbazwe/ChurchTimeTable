import { ProtectedRoute } from "@/components/auth/protected-route";
import { OperationsPage } from "@/features/operations/components/operations-page";

export default function OperationsReportsPage() {
  return (
    <ProtectedRoute requiredPermissions={["operations.report", "operations.view"]}>
      <OperationsPage tab="reports" />
    </ProtectedRoute>
  );
}
