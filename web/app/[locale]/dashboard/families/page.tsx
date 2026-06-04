import { ProtectedRoute } from "@/components/auth/protected-route";
import { FamiliesPage } from "@/features/families/components/families-page";

export default function FamiliesRoutePage() {
  return (
    <ProtectedRoute requiredPermissions={["family:view", "family:manage"]}>
      <FamiliesPage />
    </ProtectedRoute>
  );
}
