import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetMaintenancePage } from "@/features/assets/components/assets-sub-page";

export default function AssetMaintenanceRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["asset.view", "asset.maintain"]}>
      <AssetMaintenancePage />
    </ProtectedRoute>
  );
}
