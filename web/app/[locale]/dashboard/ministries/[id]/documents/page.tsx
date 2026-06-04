import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryDocumentsPage } from "@/features/ministry-services/components/ministry-documents-page";

export default async function MinistryDocumentsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["ministry.view", "ministry.manage"]}>
      <MinistryDocumentsPage ministryId={id} />
    </ProtectedRoute>
  );
}
