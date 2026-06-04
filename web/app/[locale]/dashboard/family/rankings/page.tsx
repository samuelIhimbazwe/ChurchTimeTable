import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamilyRankingsPage } from "@/features/family-contributions/screens/family-rankings-page";

export default function FamilyRankingsRoute() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>
        }
      >
        <FamilyRankingsPage />
      </Suspense>
    </ProtectedRoute>
  );
}
