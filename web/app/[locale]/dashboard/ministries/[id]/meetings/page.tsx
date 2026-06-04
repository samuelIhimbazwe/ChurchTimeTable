import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryMeetingsPage } from "@/features/ministry-services/components/ministry-meetings-page";

export default async function MinistryMeetingsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["ministry.view", "ministry.manage"]}>
      <MinistryMeetingsPage ministryId={id} />
    </ProtectedRoute>
  );
}
