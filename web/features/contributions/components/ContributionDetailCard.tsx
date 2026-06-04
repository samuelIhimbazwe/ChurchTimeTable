"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { ContributionStatusBadge } from "@/features/contributions/components/ContributionStatusBadge";
import type { MemberContributionRecord } from "@/features/contributions/types";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function ContributionDetailCard({
  record,
}: Readonly<{ record: MemberContributionRecord }>) {
  const t = useTranslations("contributions.detail");

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: t("reference"), value: record.referenceNumber },
    { label: t("status"), value: <ContributionStatusBadge status={record.status} /> },
    { label: t("type"), value: record.typeName },
    {
      label: t("campaign"),
      value: record.campaignName ?? t("noCampaign"),
    },
    {
      label: t("family"),
      value: record.familyName
        ? `${record.familyName}${record.familyCode ? ` (${record.familyCode})` : ""}`
        : "—",
    },
    { label: t("paymentDate"), value: formatDateTime(record.paymentAt) },
    {
      label: t("paymentChannel"),
      value: record.paymentChannel
        ? t(`channels.${record.paymentChannel.toLowerCase()}`)
        : "—",
    },
  ];

  if (record.discrepancyReason) {
    rows.push({
      label: t("discrepancy"),
      value: record.discrepancyReason,
    });
  }

  if (record.rejectionReason) {
    rows.push({
      label: t("rejectionReason"),
      value: record.rejectionReason,
    });
  }

  if (record.receiptUrl) {
    rows.push({
      label: t("receipt"),
      value: (
        <a
          href={record.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] hover:underline"
        >
          {t("viewReceipt")}
        </a>
      ),
    });
  }

  if (record.notes) {
    rows.push({ label: t("notes"), value: record.notes });
  }

  if (record.familyApprovedAt) {
    rows.push({
      label: t("approvedAt"),
      value: formatDateTime(record.familyApprovedAt),
    });
  }

  return (
    <CmmsCard title={t("title")} description={t("subtitle")}>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm text-[var(--foreground)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </CmmsCard>
  );
}
