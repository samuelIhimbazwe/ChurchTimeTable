import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetAssignmentsPage } from "@/features/assets/components/assets-sub-page";

export default function AssetAssignmentsRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["asset.view", "asset.assign"]}>
      <AssetAssignmentsPage />
    </ProtectedRoute>
  );
}
