import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamilyContributionDetailPage } from "@/features/family-contributions/screens/family-contribution-detail-page";

export default async function FamilyContributionDetailRoute({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>
        }
      >
        <FamilyContributionDetailPage contributionId={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
