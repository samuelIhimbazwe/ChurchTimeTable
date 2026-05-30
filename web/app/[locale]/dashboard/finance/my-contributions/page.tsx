import { ProtectedRoute } from "@/components/auth/protected-route";
import { MyContributionsDashboard } from "@/features/finance/components/my-contributions-dashboard";

/** Member stewardship — `/dashboard/finance/my-contributions` (locale-prefixed). */
export default function MyContributionsPage() {
  return (
    <ProtectedRoute>
      <MyContributionsDashboard />
    </ProtectedRoute>
  );
}
