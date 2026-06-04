import { ProtectedRoute } from "@/components/auth/protected-route";
import { UnitsPage } from "@/features/operational-units/components/units-page";

export default function UnitsRoutePage() {
  return (
    <ProtectedRoute
      requiredPermissions={[
        "operational_unit.view",
        "operational_unit.manage",
      ]}
    >
      <UnitsPage />
    </ProtectedRoute>
  );
}
