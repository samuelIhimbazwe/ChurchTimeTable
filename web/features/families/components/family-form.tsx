"use client";

import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import type { CreateFamilyInput } from "./family-form.types";

export function FamilyForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: Partial<CreateFamilyInput>;
  submitting: boolean;
  onSubmit: (values: CreateFamilyInput) => void;
  onCancel: () => void;
}>) {
  const t = useTranslations("families");

  return (
    <CmmsCard title={initial?.familyName ? t("editFamily") : t("createFamily")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSubmit({
            familyName: String(form.get("familyName") ?? ""),
            notes: String(form.get("notes") ?? "") || undefined,
            headMemberId: String(form.get("headMemberId") ?? "") || undefined,
          });
        }}
      >
        <CmmsFormField label={t("fields.name")} htmlFor="familyName">
          <CmmsInput
            id="familyName"
            name="familyName"
            defaultValue={initial?.familyName ?? ""}
            required
          />
        </CmmsFormField>
        <CmmsFormField label={t("fields.notes")} htmlFor="notes">
          <CmmsInput id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
        </CmmsFormField>
        <CmmsFormField label={t("fields.headMemberId")} htmlFor="headMemberId">
          <CmmsInput
            id="headMemberId"
            name="headMemberId"
            defaultValue={initial?.headMemberId ?? ""}
            placeholder={t("fields.headMemberIdHint")}
          />
        </CmmsFormField>
        <div className="flex justify-end gap-2">
          <CmmsButton type="button" variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </CmmsButton>
          <CmmsButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? t("saving") : t("save")}
          </CmmsButton>
        </div>
      </form>
    </CmmsCard>
  );
}
