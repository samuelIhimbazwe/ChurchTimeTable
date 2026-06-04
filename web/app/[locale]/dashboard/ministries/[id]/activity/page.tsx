import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryActivityPage } from "@/features/ministry-services/components/ministry-activity-page";

export default async function MinistryActivityRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["ministry.view", "ministry.manage"]}>
      <MinistryActivityPage ministryId={id} />
    </ProtectedRoute>
  );
}
