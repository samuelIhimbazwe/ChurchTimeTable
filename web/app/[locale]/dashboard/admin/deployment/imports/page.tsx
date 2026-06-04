import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";
import { ImportCenterWizard } from "@/features/deployment/components/import-center-wizard";

const IMPORT_PERMISSIONS = [
  ...PLATFORM_ADMIN_VIEW_PERMISSIONS,
  "pilot.import.manage",
  "pilot.readiness.view",
] as const;

export default function ImportCenterPage() {
  return (
    <ProtectedRoute requiredPermissions={[...IMPORT_PERMISSIONS]}>
      <ImportCenterWizard />
    </ProtectedRoute>
  );
}
