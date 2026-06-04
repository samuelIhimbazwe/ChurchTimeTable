"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import type { ContributionStatus } from "@/features/contributions/types";

function statusVariant(
  status: ContributionStatus,
): "success" | "warning" | "info" | "danger" | "neutral" {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "SUBMITTED":
      return "warning";
    case "REJECTED":
      return "danger";
    case "PENDING":
      return "info";
    default:
      return "neutral";
  }
}

export function ContributionStatusBadge({
  status,
}: Readonly<{ status: ContributionStatus }>) {
  const t = useTranslations("contributions.status");
  return (
    <CmmsBadge variant={statusVariant(status)}>
      {t(status.toLowerCase())}
    </CmmsBadge>
  );
}
