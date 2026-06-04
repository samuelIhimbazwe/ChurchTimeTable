"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { getApiErrorMessage, recordWelfareAssistance } from "@/core/api/http";
import { Link } from "@/i18n/routing";

const ASSISTANCE_TYPES = [
  "CASH",
  "TRANSPORT",
  "FOOD",
  "HOSPITAL",
  "MATERIAL",
  "VOLUNTEER",
  "PRAYER",
  "COUNSELING",
  "OTHER",
] as const;

export function WelfareAssistancePage({ caseId }: Readonly<{ caseId: string }>) {
  const t = useTranslations("welfare");
  const queryClient = useQueryClient();
  const [assistanceType, setAssistanceType] = useState<string>("CASH");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      recordWelfareAssistance({
        caseId,
        assistanceType,
        description,
        amount: amount ? Number(amount) : undefined,
      }),
    onSuccess: async () => {
      setDescription("");
      setAmount("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["welfare"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <OperationalScreen title={t("assistanceTitle")} subtitle={t("assistanceSubtitle")}>
      <Link
        href={`/dashboard/welfare/${caseId}`}
        className="mb-4 inline-block text-sm text-primary underline"
      >
        {t("backToCase")}
      </Link>
      <div className="max-w-lg space-y-4">
        <CmmsFormField label={t("assistanceType")} htmlFor="type">
          <select
            id="type"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={assistanceType}
            onChange={(e) => setAssistanceType(e.target.value)}
          >
            {ASSISTANCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`assistanceTypes.${type}`)}
              </option>
            ))}
          </select>
        </CmmsFormField>
        <CmmsFormField label={t("description")} htmlFor="description">
          <CmmsInput
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CmmsFormField>
        <CmmsFormField label={t("amountOptional")} htmlFor="amount">
          <CmmsInput
            id="amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </CmmsFormField>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <CmmsButton
          disabled={description.length < 3 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {t("recordAssistance")}
        </CmmsButton>
      </div>
    </OperationalScreen>
  );
}
