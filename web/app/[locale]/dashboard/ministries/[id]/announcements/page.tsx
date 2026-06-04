import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryAnnouncementsPage } from "@/features/ministry-services/components/ministry-announcements-page";

export default async function MinistryAnnouncementsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["ministry.view", "ministry.manage"]}>
      <MinistryAnnouncementsPage ministryId={id} />
    </ProtectedRoute>
  );
}
