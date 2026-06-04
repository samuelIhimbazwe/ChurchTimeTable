import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberProfileCenter } from "@/features/member-profile/components/member-profile-center";

export default async function MemberProfilePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <MemberProfileCenter memberId={id} />
    </ProtectedRoute>
  );
}
