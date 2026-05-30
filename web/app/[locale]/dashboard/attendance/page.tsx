import { ProtectedRoute } from "@/components/auth/protected-route";
import { ATTENDANCE_ACCESS_PERMISSIONS } from "@/core/auth/governance-permissions";
import { AttendanceEngine } from "@/features/attendance/components/attendance-engine";

export default function DashboardAttendancePage() {
  return (
    <ProtectedRoute requiredPermissions={[...ATTENDANCE_ACCESS_PERMISSIONS]}>
      <AttendanceEngine />
    </ProtectedRoute>
  );
}
