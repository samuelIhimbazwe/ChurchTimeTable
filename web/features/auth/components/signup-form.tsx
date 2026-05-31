"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsSelect } from "@/components/ui/cmms-select";
import {
  fetchCurrentUser,
  getApiErrorMessage,
  registerRequest,
} from "@/core/api/http";
import { getPostAuthPath } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";
import { Link, useRouter } from "@/i18n/routing";
import { PasswordInput } from "@/features/auth/components/password-input";

type Ministry = "CHOIR" | "PROTOCOL" | "BOTH";
type Step = 1 | 2 | 3 | 4;

export function SignupForm() {
  const t = useTranslations("onboarding.signup");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);

  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ministry, setMinistry] = useState<Ministry>("CHOIR");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ministryDescription = useMemo(() => {
    if (ministry === "PROTOCOL") return t("ministryProtocolDescription");
    if (ministry === "BOTH") return t("ministryBothDescription");
    return t("ministryChoirDescription");
  }, [ministry, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const accessToken = await registerRequest({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        ministry,
        preferredLanguage: locale,
      });
      const profile = await fetchCurrentUser();
      setSession({ accessToken, profile });
      router.replace(getPostAuthPath(profile));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, ta("registerFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((value) => (
          <div
            key={value}
            className={`h-2 flex-1 rounded-full ${
              step >= value ? "bg-[var(--primary)]" : "bg-[var(--surface-subtle)]"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        {t("stepIndicator", { step, total: 4 })}
      </p>

      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepIdentityTitle")}</h2>
          <CmmsInput
            id="firstName"
            label={t("firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <CmmsInput
            id="lastName"
            label={t("lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
          <CmmsInput
            id="email"
            type="email"
            label={ta("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <CmmsInput
            id="phone"
            type="tel"
            label={t("phone")}
            hint={t("phoneOptional")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepMinistryTitle")}</h2>
          <CmmsFormField label={t("ministryLabel")} required>
            <CmmsSelect
              value={ministry}
              onChange={(event) => setMinistry(event.target.value as Ministry)}
            >
              <option value="CHOIR">{t("ministryChoir")}</option>
              <option value="PROTOCOL">{t("ministryProtocol")}</option>
              <option value="BOTH">{t("ministryBoth")}</option>
            </CmmsSelect>
          </CmmsFormField>
          <p className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]">
            {ministryDescription}
          </p>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepSecurityTitle")}</h2>
          <PasswordInput
            id="password"
            label={ta("password")}
            value={password}
            onChange={setPassword}
            hint={ta("passwordHint")}
            required
          />
          <PasswordInput
            id="confirmPassword"
            label={t("confirmPassword")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepReviewTitle")}</h2>
          <dl className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] p-4 text-sm">
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("reviewName")}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {firstName} {lastName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">{ta("email")}</dt>
              <dd className="font-medium text-[var(--foreground)]">{email}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("ministryLabel")}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {ministry === "CHOIR"
                  ? t("ministryChoir")
                  : ministry === "PROTOCOL"
                    ? t("ministryProtocol")
                    : t("ministryBoth")}
              </dd>
            </div>
          </dl>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">{t("approvalExplanation")}</p>
        </div>
      ) : null}

      {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <CmmsButton type="button" variant="secondary" onClick={() => setStep((current) => (current - 1) as Step)}>
            {t("back")}
          </CmmsButton>
        ) : null}
        {step < 4 ? (
          <CmmsButton
            type="button"
            onClick={() => setStep((current) => (current + 1) as Step)}
            disabled={
              (step === 1 && (!firstName || !lastName || !email)) ||
              (step === 3 && (!password || password.length < 6))
            }
          >
            {t("continue")}
          </CmmsButton>
        ) : (
          <CmmsButton type="submit" disabled={submitting} fullWidth>
            {submitting ? t("submitting") : t("submit")}
          </CmmsButton>
        )}
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-[var(--primary)]">
          {ta("submit")}
        </Link>
      </p>
    </form>
  );
}
