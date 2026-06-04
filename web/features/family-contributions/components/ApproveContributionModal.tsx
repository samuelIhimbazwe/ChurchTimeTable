"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { getApiErrorMessage } from "@/core/api/http";
import { formatCurrency } from "@/features/dashboard/components/dashboard-primitives";
import type { MemberContributionRecord } from "@/features/contributions/types";
import { useApproveFamilyContributionMutation } from "@/features/family-contributions/hooks/use-family-contribution-queries";

export function ApproveContributionModal({
  open,
  onClose,
  record,
  familyId,
  onSuccess,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  record: MemberContributionRecord | null;
  familyId: string;
  onSuccess: () => void;
}>) {
  const t = useTranslations("familyContributions.approve");
  const mutation = useApproveFamilyContributionMutation(familyId);
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && record) {
      setConfirmedAmount(String(record.claimedAmount));
      setDiscrepancyReason("");
      setError(null);
    }
  }, [open, record]);

  if (!record) return null;

  const contributionId = record.id;
  const claimed = record.claimedAmount;
  const needsReason =
    confirmedAmount !== "" && Number(confirmedAmount) !== claimed;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const amount = Number(confirmedAmount);
    if (!amount || amount <= 0) {
      setError(t("invalidAmount"));
      return;
    }
    try {
      await mutation.mutateAsync({
        contributionId,
        input: {
          confirmedAmount: amount,
          discrepancyReason: needsReason ? discrepancyReason : undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, t("failed")));
    }
  }

  return (
    <CmmsModal open={open} onClose={onClose} title={t("title")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("hint", {
            reference: record.referenceNumber,
            member: record.memberName,
            claimed: formatCurrency(claimed, record.currency),
          })}
        </p>
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        <CmmsFormField label={t("confirmedAmount")}>
          <CmmsInput
            type="number"
            min={0.01}
            step="any"
            required
            value={confirmedAmount}
            onChange={(e) => setConfirmedAmount(e.target.value)}
            placeholder={String(claimed)}
          />
        </CmmsFormField>
        {needsReason ? (
          <CmmsFormField label={t("discrepancyReason")}>
            <CmmsInput
              required
              minLength={3}
              value={discrepancyReason}
              onChange={(e) => setDiscrepancyReason(e.target.value)}
            />
          </CmmsFormField>
        ) : null}
        <div className="flex justify-end gap-2">
          <CmmsButton type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </CmmsButton>
          <CmmsButton type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? t("submitting") : t("confirm")}
          </CmmsButton>
        </div>
      </form>
    </CmmsModal>
  );
}
