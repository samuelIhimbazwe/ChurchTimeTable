import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default function ProfileSettingsPage() {
  return (
    <ProtectedRoute>
      <ProfileForm />
    </ProtectedRoute>
  );
}
