import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryReportsPage } from "@/features/ministry-services/components/ministry-reports-page";

export default async function MinistryReportsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["ministry.report.view", "ministry.manage"]}>
      <MinistryReportsPage ministryId={id} />
    </ProtectedRoute>
  );
}
