import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContributionNewPage } from "@/features/contributions/screens/contribution-new-page";

export default function NewContributionPage() {
  return (
    <ProtectedRoute requiredPermissions={["choir.contribution.submit"]}>
      <ContributionNewPage />
    </ProtectedRoute>
  );
}
