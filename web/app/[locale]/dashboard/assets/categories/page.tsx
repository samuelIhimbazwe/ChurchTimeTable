import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetCategoriesPage } from "@/features/assets/components/assets-sub-page";

export default function AssetCategoriesRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["asset.view", "asset.manage"]}>
      <AssetCategoriesPage />
    </ProtectedRoute>
  );
}
