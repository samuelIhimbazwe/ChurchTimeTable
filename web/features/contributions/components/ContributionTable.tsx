"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { CmmsTable, type CmmsTableColumn } from "@/components/ui/cmms-table";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import { ContributionStatusBadge } from "@/features/contributions/components/ContributionStatusBadge";
import type { MemberContributionRecord } from "@/features/contributions/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function displayAmount(
  record: MemberContributionRecord,
  field: "claimed" | "confirmed" | "effective",
) {
  if (field === "claimed") {
    return formatCurrency(record.claimedAmount, record.currency);
  }
  if (field === "confirmed" && record.confirmedAmount != null) {
    return formatCurrency(record.confirmedAmount, record.currency);
  }
  if (field === "effective" && record.effectiveAmount != null) {
    return formatCurrency(record.effectiveAmount, record.currency);
  }
  return "—";
}

export function ContributionTable({
  items,
}: Readonly<{ items: MemberContributionRecord[] }>) {
  const t = useTranslations("contributions.table");

  const columns = useMemo<CmmsTableColumn<MemberContributionRecord>[]>(
    () => [
      {
        key: "reference",
        header: t("reference"),
        render: (row) => (
          <Link
            href={`/dashboard/contributions/${row.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.referenceNumber}
          </Link>
        ),
      },
      {
        key: "status",
        header: t("status"),
        render: (row) => <ContributionStatusBadge status={row.status} />,
      },
      {
        key: "type",
        header: t("type"),
        render: (row) => row.typeName,
      },
      {
        key: "campaign",
        header: t("campaign"),
        render: (row) => row.campaignName ?? "—",
      },
      {
        key: "claimed",
        header: t("claimed"),
        render: (row) => displayAmount(row, "claimed"),
      },
      {
        key: "confirmed",
        header: t("confirmed"),
        render: (row) => displayAmount(row, "confirmed"),
      },
      {
        key: "effective",
        header: t("effective"),
        render: (row) => displayAmount(row, "effective"),
      },
      {
        key: "paymentDate",
        header: t("paymentDate"),
        render: (row) => formatDate(row.paymentAt),
      },
    ],
    [t],
  );

  return <CmmsTable columns={columns} rows={items} />;
}
