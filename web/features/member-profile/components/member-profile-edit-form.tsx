"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import type { MemberProfileCenterPayload } from "@/core/api/http";
import { useUpdateMemberProfileMutation } from "@/features/member-profile/hooks/use-member-profile";

const VOICE_PARTS = ["SOPRANO", "ALTO", "TENOR", "BASS", "UNSPECIFIED"] as const;

export function MemberProfileEditForm({
  memberId,
  profile,
  onSaved,
}: Readonly<{
  memberId: string;
  profile: MemberProfileCenterPayload["profile"] | null;
  onSaved?: () => void;
}>) {
  const t = useTranslations("memberProfile.edit");
  const mutation = useUpdateMemberProfileMutation(memberId);

  const [voicePart, setVoicePart] = useState(profile?.voicePart ?? "UNSPECIFIED");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    profile?.emergencyContactName ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    profile?.emergencyContactPhone ?? "",
  );
  const [choirJoinDate, setChoirJoinDate] = useState(
    profile?.choirJoinDate?.slice(0, 10) ?? "",
  );
  const [notes, setNotes] = useState(profile?.notes ?? "");

  return (
    <CmmsCard title={t("title")} description={t("hint")}>
      <form
        className="cmms-section-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void mutation
            .mutateAsync({
              voicePart,
              address: address.trim() || null,
              emergencyContactName: emergencyContactName.trim() || null,
              emergencyContactPhone: emergencyContactPhone.trim() || null,
              choirJoinDate: choirJoinDate || null,
              notes: notes.trim() || null,
            })
            .then(() => onSaved?.());
        }}
      >
        <CmmsFormField label={t("voicePart")} htmlFor="voicePart">
          <select
            id="voicePart"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={voicePart}
            onChange={(event) => setVoicePart(event.target.value)}
          >
            {VOICE_PARTS.map((part) => (
              <option key={part} value={part}>
                {t(`voiceParts.${part}`)}
              </option>
            ))}
          </select>
        </CmmsFormField>

        <CmmsFormField label={t("address")} htmlFor="address">
          <CmmsInput
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </CmmsFormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <CmmsFormField label={t("emergencyName")} htmlFor="emergencyName">
            <CmmsInput
              id="emergencyName"
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
            />
          </CmmsFormField>
          <CmmsFormField label={t("emergencyPhone")} htmlFor="emergencyPhone">
            <CmmsInput
              id="emergencyPhone"
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value)}
            />
          </CmmsFormField>
        </div>

        <CmmsFormField label={t("choirJoinDate")} htmlFor="choirJoinDate">
          <CmmsInput
            id="choirJoinDate"
            type="date"
            value={choirJoinDate}
            onChange={(event) => setChoirJoinDate(event.target.value)}
          />
        </CmmsFormField>

        <CmmsFormField label={t("notes")} htmlFor="notes">
          <textarea
            id="notes"
            className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </CmmsFormField>

        {mutation.isError ? (
          <p className="text-sm text-[var(--danger)]">{t("saveError")}</p>
        ) : null}
        {mutation.isSuccess ? (
          <p className="text-sm text-[var(--success)]">{t("saveSuccess")}</p>
        ) : null}

        <CmmsButton type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? t("saving") : t("save")}
        </CmmsButton>
      </form>
    </CmmsCard>
  );
}
