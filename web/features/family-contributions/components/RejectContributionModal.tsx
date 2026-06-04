"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { getApiErrorMessage } from "@/core/api/http";
import type { MemberContributionRecord } from "@/features/contributions/types";
import { useRejectFamilyContributionMutation } from "@/features/family-contributions/hooks/use-family-contribution-queries";

export function RejectContributionModal({
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
  const t = useTranslations("familyContributions.reject");
  const mutation = useRejectFamilyContributionMutation(familyId);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!record) return null;

  const contributionId = record.id;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (rejectionReason.trim().length < 3) {
      setError(t("reasonRequired"));
      return;
    }
    try {
      await mutation.mutateAsync({
        contributionId,
        input: { rejectionReason: rejectionReason.trim() },
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
          {t("hint", { reference: record.referenceNumber, member: record.memberName })}
        </p>
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        <CmmsFormField label={t("reason")}>
          <CmmsInput
            required
            minLength={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </CmmsFormField>
        <div className="flex justify-end gap-2">
          <CmmsButton type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </CmmsButton>
          <CmmsButton type="submit" variant="danger" disabled={mutation.isPending}>
            {mutation.isPending ? t("submitting") : t("confirm")}
          </CmmsButton>
        </div>
      </form>
    </CmmsModal>
  );
}
