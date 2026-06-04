import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamilyPendingPage } from "@/features/family-contributions/screens/family-pending-page";

export default function FamilyPendingRoute() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>
        }
      >
        <FamilyPendingPage />
      </Suspense>
    </ProtectedRoute>
  );
}
