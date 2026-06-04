import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistriesPage } from "@/features/ministries/components/ministries-page";

export default function MinistriesRoutePage() {
  return (
    <ProtectedRoute
      requiredPermissions={["ministry.view", "ministry.manage"]}
    >
      <MinistriesPage />
    </ProtectedRoute>
  );
}
