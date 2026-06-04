import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChoirReportsPage } from "@/features/choir-reports/components/choir-reports-page";

export default function ChoirReportsRoutePage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "choir.welfare.view",
        "choir.welfare.manage",
        "choir.music.view",
        "choir.music.manage",
        "choir.rehearsal.view",
        "choir.rehearsal.manage",
        "choir.operations.manage",
      ]}
    >
      <ChoirReportsPage />
    </ProtectedRoute>
  );
}
