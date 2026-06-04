import { ProtectedRoute } from "@/components/auth/protected-route";
import { OperationsPage } from "@/features/operations/components/operations-page";

export default function OperationsRecommendationsPage() {
  return (
    <ProtectedRoute requiredPermissions={["operations.view", "operations.manage"]}>
      <OperationsPage tab="recommendations" />
    </ProtectedRoute>
  );
}
