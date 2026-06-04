import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContributionsListPage } from "@/features/contributions/screens/contributions-list-page";

export default function ContributionsPage() {
  return (
    <ProtectedRoute>
      <ContributionsListPage />
    </ProtectedRoute>
  );
}
