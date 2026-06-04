import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";
import { ChurchSetupWizard } from "@/features/deployment/components/church-setup-wizard";

const SETUP_PERMISSIONS = [
  ...PLATFORM_ADMIN_VIEW_PERMISSIONS,
  "pilot.readiness.view",
  "admin.settings.manage",
] as const;

export default function ChurchSetupPage() {
  return (
    <ProtectedRoute requiredPermissions={[...SETUP_PERMISSIONS]}>
      <ChurchSetupWizard />
    </ProtectedRoute>
  );
}
