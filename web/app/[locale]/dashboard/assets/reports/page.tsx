import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetReportsPage } from "@/features/assets/components/assets-sub-page";

export default function AssetReportsRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["asset.report", "asset.manage"]}>
      <AssetReportsPage />
    </ProtectedRoute>
  );
}
