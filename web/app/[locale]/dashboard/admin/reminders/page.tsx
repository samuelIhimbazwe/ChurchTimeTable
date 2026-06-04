import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";
import { RemindersDashboard } from "@/features/deployment/components/reminders-dashboard";

const REMINDER_PERMISSIONS = [
  ...PLATFORM_ADMIN_VIEW_PERMISSIONS,
  "pilot.readiness.view",
  "admin.settings.manage",
] as const;

export default function AdminRemindersPage() {
  return (
    <ProtectedRoute requiredPermissions={[...REMINDER_PERMISSIONS]}>
      <RemindersDashboard />
    </ProtectedRoute>
  );
}
