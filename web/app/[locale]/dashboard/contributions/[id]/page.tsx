import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContributionDetailPage } from "@/features/contributions/screens/contribution-detail-page";

export default async function ContributionDetailRoute({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <ContributionDetailPage contributionId={id} />
    </ProtectedRoute>
  );
}
