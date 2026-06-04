import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryDetailPage } from "@/features/ministries/components/ministry-detail-page";

export default async function MinistryDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute
      requiredPermissions={["ministry.view", "ministry.manage"]}
    >
      <MinistryDetailPage ministryId={id} />
    </ProtectedRoute>
  );
}
