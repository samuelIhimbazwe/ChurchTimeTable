"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  getApiErrorMessage,
  updateProfileRequest,
} from "@/core/api/http";
import { useSessionStore } from "@/core/auth/session-store";

export function ProfileForm() {
  const t = useTranslations("profile");
  const profile = useSessionStore((state) => state.profile);
  const setProfile = useSessionStore((state) => state.setProfile);

  const [firstName, setFirstName] = useState(profile?.member?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.member?.lastName ?? "");
  const [phone, setPhone] = useState(profile?.member?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await updateProfileRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });

      if (profile) {
        setProfile({
          ...profile,
          member: {
            ...profile.member,
            ...updated.member,
            missingPhone: updated.member?.missingPhone ?? false,
          },
          phoneEnforcement: profile.phoneEnforcement
            ? {
                ...profile.phoneEnforcement,
                blocked: false,
              }
            : profile.phoneEnforcement,
        });
      }

      setSuccess(true);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, t("saveError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CmmsCard className="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
        </div>

        <CmmsFormField label={t("firstName")} required>
          <CmmsInput
            id="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            minLength={2}
            maxLength={50}
          />
        </CmmsFormField>

        <CmmsFormField label={t("lastName")} required>
          <CmmsInput
            id="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            minLength={2}
            maxLength={50}
          />
        </CmmsFormField>

        <CmmsFormField label={t("phone")} hint={t("phoneHint")}>
          <CmmsInput
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0781234567"
          />
        </CmmsFormField>

        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        {success ? <CmmsAlert variant="success">{t("saveSuccess")}</CmmsAlert> : null}

        <CmmsButton type="submit" disabled={submitting}>
          {submitting ? t("saving") : t("save")}
        </CmmsButton>
      </form>
    </CmmsCard>
  );
}
