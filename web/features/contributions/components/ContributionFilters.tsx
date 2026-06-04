"use client";

import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsSelect } from "@/components/ui/cmms-select";
import type { ContributionStatus } from "@/features/contributions/types";

export interface ContributionFiltersValue {
  status: ContributionStatus | "ALL";
  contributionTypeCatalogId: string;
}

export function ContributionFilters({
  value,
  onChange,
  typeOptions,
}: Readonly<{
  value: ContributionFiltersValue;
  onChange: (next: ContributionFiltersValue) => void;
  typeOptions: Array<{ id: string; name: string }>;
}>) {
  const t = useTranslations("contributions.filters");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CmmsFormField label={t("status")} className="min-w-[10rem] flex-1">
        <CmmsSelect
          value={value.status}
          onChange={(e) =>
            onChange({
              ...value,
              status: e.target.value as ContributionFiltersValue["status"],
            })
          }
        >
          <option value="ALL">{t("statusAll")}</option>
          <option value="SUBMITTED">{t("statusSubmitted")}</option>
          <option value="CONFIRMED">{t("statusConfirmed")}</option>
          <option value="REJECTED">{t("statusRejected")}</option>
          <option value="PENDING">{t("statusPending")}</option>
        </CmmsSelect>
      </CmmsFormField>
      <CmmsFormField label={t("type")} className="min-w-[12rem] flex-1">
        <CmmsSelect
          value={value.contributionTypeCatalogId}
          onChange={(e) =>
            onChange({ ...value, contributionTypeCatalogId: e.target.value })
          }
        >
          <option value="">{t("typeAll")}</option>
          {typeOptions.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </CmmsSelect>
      </CmmsFormField>
      <CmmsButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange({ status: "ALL", contributionTypeCatalogId: "" })
        }
      >
        {t("reset")}
      </CmmsButton>
    </div>
  );
}
