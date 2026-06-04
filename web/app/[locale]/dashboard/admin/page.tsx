import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";
import { AdminDashboardPreview } from "@/features/dashboard/components/admin-dashboard-preview";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredPermissions={[...PLATFORM_ADMIN_VIEW_PERMISSIONS]}>
      <div className="space-y-4">
        <p className="px-6 pt-4 text-sm">
          <Link
            href="/dashboard/admin/tools"
            className="text-primary underline"
          >
            Pilot admin tools
          </Link>
          {" — imports, exports, data quality, and readiness."}
        </p>
        <AdminDashboardPreview />
      </div>
    </ProtectedRoute>
  );
}
