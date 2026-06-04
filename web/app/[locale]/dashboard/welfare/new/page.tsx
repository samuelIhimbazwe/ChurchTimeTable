import { ProtectedRoute } from "@/components/auth/protected-route";
import { WelfareCreateWizard } from "@/features/welfare/components/welfare-create-wizard";

export default function WelfareCreatePage() {
  return (
    <ProtectedRoute requiredPermissions={["choir.welfare.manage"]}>
      <WelfareCreateWizard />
    </ProtectedRoute>
  );
}
