import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminDashboardPreview } from "@/features/dashboard/components/admin-dashboard-preview";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={["SUPER_ADMIN"]} requiredPermissions={["audit:read"]}>
      <AdminDashboardPreview />
    </ProtectedRoute>
  );
}
