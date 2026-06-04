import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamilyContributionsHubPage } from "@/features/family-contributions/screens/family-contributions-hub";

export default function FamilyContributionsRoute() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>
        }
      >
        <FamilyContributionsHubPage />
      </Suspense>
    </ProtectedRoute>
  );
}
