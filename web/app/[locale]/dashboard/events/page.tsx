import { ProtectedRoute } from "@/components/auth/protected-route";
import { EventEngine } from "@/features/events/components/event-engine";

export default function DashboardEventsPage() {
  return (
    <ProtectedRoute requiredPermissions={["event:read"]}>
      <EventEngine />
    </ProtectedRoute>
  );
}
