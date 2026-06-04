import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamilyGoalsPage } from "@/features/family-contributions/screens/family-goals-page";

export default function FamilyGoalsRoute() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>
        }
      >
        <FamilyGoalsPage />
      </Suspense>
    </ProtectedRoute>
  );
}
