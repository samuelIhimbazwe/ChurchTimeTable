import { ProtectedRoute } from "@/components/auth/protected-route";
import { WelfareAssistancePage } from "@/features/welfare/components/welfare-assistance-page";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  return (
    <ProtectedRoute requiredPermissions={["choir.welfare.manage"]}>
      <WelfareAssistancePage caseId={id} />
    </ProtectedRoute>
  );
}
