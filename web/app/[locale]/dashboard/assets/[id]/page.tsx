import { ProtectedRoute } from "@/components/auth/protected-route";
import { AssetDetailPage } from "@/features/assets/components/asset-detail-page";

export default async function AssetDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["asset.view", "asset.manage"]}>
      <AssetDetailPage assetId={id} />
    </ProtectedRoute>
  );
}
