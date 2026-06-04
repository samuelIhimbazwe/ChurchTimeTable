"use client";

import { useTranslations } from "next-intl";

import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsSelect } from "@/components/ui/cmms-select";
import type { FamilyLeadershipContextItem } from "@/features/family-contributions/types";

export function FamilyContextPicker({
  families,
  value,
  onChange,
}: Readonly<{
  families: FamilyLeadershipContextItem[];
  value: string | undefined;
  onChange: (familyId: string) => void;
}>) {
  const t = useTranslations("familyContributions.picker");

  if (families.length <= 1) {
    const only = families[0];
    if (!only) return null;
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        {t("singleFamily", {
          name: only.familyName,
          code: only.familyCode ?? "",
        })}
      </p>
    );
  }

  return (
    <CmmsFormField label={t("label")} className="max-w-md">
      <CmmsSelect
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled>
          {t("placeholder")}
        </option>
        {families.map((family) => (
          <option key={family.familyId} value={family.familyId}>
            {family.familyName}
            {family.familyCode ? ` (${family.familyCode})` : ""} — {t(`roles.${family.role.toLowerCase()}`)}
          </option>
        ))}
      </CmmsSelect>
    </CmmsFormField>
  );
}
