"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { getApiErrorMessage } from "@/core/api/http";
import type {
  ContributionCampaignOption,
  ContributionCatalogType,
  PaymentChannel,
  SubmitContributionInput,
} from "@/features/contributions/types";

export function ContributionForm({
  types,
  campaigns,
  submitting,
  onSubmit,
  onCancel,
}: Readonly<{
  types: ContributionCatalogType[];
  campaigns: ContributionCampaignOption[];
  submitting: boolean;
  onSubmit: (values: SubmitContributionInput) => Promise<void>;
  onCancel: () => void;
}>) {
  const t = useTranslations("contributions.form");
  const [error, setError] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState(types[0]?.id ?? "");

  const filteredCampaigns = useMemo(
    () => campaigns.filter((c) => c.contributionTypeCatalogId === catalogId),
    [campaigns, catalogId],
  );

  const defaultPaymentAt = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  return (
    <CmmsCard title={t("title")} description={t("subtitle")}>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const payload: SubmitContributionInput = {
            contributionTypeCatalogId: String(form.get("contributionTypeCatalogId")),
            claimedAmount: Number(form.get("claimedAmount")),
            paymentAt: new Date(String(form.get("paymentAt"))).toISOString(),
            paymentChannel: String(form.get("paymentChannel")) as PaymentChannel,
            currency: String(form.get("currency") || "RWF"),
            notes: String(form.get("notes") || "") || undefined,
            receiptUrl: String(form.get("receiptUrl") || "") || undefined,
          };
          const campaignId = String(form.get("contributionCampaignId") || "");
          if (campaignId) {
            payload.contributionCampaignId = campaignId;
          }
          try {
            await onSubmit(payload);
          } catch (err) {
            setError(getApiErrorMessage(err, t("submitFailed")));
          }
        }}
      >
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}

        <CmmsFormField label={t("type")}>
          <CmmsSelect
            id="contributionTypeCatalogId"
            name="contributionTypeCatalogId"
            required
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>

        <CmmsFormField label={t("campaign")}>
          <CmmsSelect id="contributionCampaignId" name="contributionCampaignId">
            <option value="">{t("campaignOptional")}</option>
            {filteredCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>

        <CmmsFormField label={t("claimedAmount")}>
          <CmmsInput
            id="claimedAmount"
            name="claimedAmount"
            type="number"
            min={1}
            step="any"
            required
          />
        </CmmsFormField>

        <CmmsFormField label={t("paymentAt")}>
          <CmmsInput
            id="paymentAt"
            name="paymentAt"
            type="datetime-local"
            defaultValue={defaultPaymentAt}
            required
          />
        </CmmsFormField>

        <CmmsFormField label={t("paymentChannel")}>
          <CmmsSelect id="paymentChannel" name="paymentChannel" required defaultValue="MOMO">
            <option value="MOMO">{t("channels.momo")}</option>
            <option value="BANK">{t("channels.bank")}</option>
            <option value="OTHER">{t("channels.other")}</option>
          </CmmsSelect>
        </CmmsFormField>

        <CmmsFormField label={t("currency")}>
          <CmmsInput id="currency" name="currency" defaultValue="RWF" maxLength={8} />
        </CmmsFormField>

        <CmmsFormField label={t("receiptUrl")}>
          <CmmsInput
            id="receiptUrl"
            name="receiptUrl"
            type="url"
            placeholder={t("receiptUrlHint")}
          />
        </CmmsFormField>

        <CmmsFormField label={t("notes")}>
          <CmmsInput id="notes" name="notes" maxLength={500} />
        </CmmsFormField>

        <div className="flex justify-end gap-2">
          <CmmsButton type="button" variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </CmmsButton>
          <CmmsButton type="submit" variant="primary" disabled={submitting || types.length === 0}>
            {submitting ? t("submitting") : t("submit")}
          </CmmsButton>
        </div>
      </form>
    </CmmsCard>
  );
}
