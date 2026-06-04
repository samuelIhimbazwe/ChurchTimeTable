import { ProtectedRoute } from "@/components/auth/protected-route";
import { WelfareCaseDetail } from "@/features/welfare/components/welfare-case-detail";

export default async function WelfareCaseDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  return (
    <ProtectedRoute
      requiredPermissions={["choir.welfare.view", "choir.welfare.manage"]}
    >
      <WelfareCaseDetail caseId={id} />
    </ProtectedRoute>
  );
}
