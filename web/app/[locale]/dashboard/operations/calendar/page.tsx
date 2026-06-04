import { ProtectedRoute } from "@/components/auth/protected-route";
import { OperationsPage } from "@/features/operations/components/operations-page";

export default function OperationsCalendarPage() {
  return (
    <ProtectedRoute requiredPermissions={["operations.view", "operations.manage"]}>
      <OperationsPage tab="calendar" />
    </ProtectedRoute>
  );
}
