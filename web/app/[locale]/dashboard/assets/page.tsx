import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetsPage } from "@/features/assets/components/assets-page";

export default function AssetsRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["asset.view", "asset.manage"]}>
      <AssetsPage />
    </ProtectedRoute>
  );
}
