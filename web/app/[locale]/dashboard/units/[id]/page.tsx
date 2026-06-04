import { ProtectedRoute } from "@/components/auth/protected-route";
import { UnitDetailPage } from "@/features/operational-units/components/unit-detail-page";

export default async function UnitDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute
      requiredPermissions={[
        "operational_unit.view",
        "operational_unit.manage",
      ]}
    >
      <UnitDetailPage unitId={id} />
    </ProtectedRoute>
  );
}
