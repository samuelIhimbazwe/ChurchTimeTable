import { ProtectedRoute } from "@/components/auth/protected-route";
import { MinistryFinancePage } from "@/features/ministry-finance/components/ministry-finance-page";

export default async function MinistryFinanceRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute
      requiredPermissions={["ministry.finance.view", "ministry.finance.manage"]}
    >
      <MinistryFinancePage ministryId={id} />
    </ProtectedRoute>
  );
}
