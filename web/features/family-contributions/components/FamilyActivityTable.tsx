"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { CmmsTable, type CmmsTableColumn } from "@/components/ui/cmms-table";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import { ContributionStatusBadge } from "@/features/contributions/components/ContributionStatusBadge";
import type { FamilyInboxItem } from "@/features/family-contributions/types";

export function FamilyActivityTable({
  items,
  familyId,
}: Readonly<{ items: FamilyInboxItem[]; familyId: string }>) {
  const t = useTranslations("familyContributions.activity.table");

  const columns = useMemo<CmmsTableColumn<FamilyInboxItem>[]>(
    () => [
      {
        key: "reference",
        header: t("reference"),
        render: (row) => (
          <Link
            href={`/dashboard/family/contributions/${row.id}?familyId=${familyId}`}
            className="text-[var(--primary)] hover:underline"
          >
            {row.referenceNumber}
          </Link>
        ),
      },
      { key: "member", header: t("member"), render: (row) => row.memberName },
      { key: "type", header: t("type"), render: (row) => row.typeName },
      {
        key: "amount",
        header: t("amount"),
        render: (row) =>
          formatCurrency(row.confirmedAmount ?? row.claimedAmount),
      },
      {
        key: "status",
        header: t("status"),
        render: (row) => <ContributionStatusBadge status={row.status} />,
      },
    ],
    [t, familyId],
  );

  return <CmmsTable columns={columns} rows={items} emptyState={t("empty")} />;
}
