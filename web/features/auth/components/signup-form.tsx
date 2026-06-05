"use client";

import { FormEvent, useState } from "react";
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
  trackUxEvent,
} from "@/core/api/http";
import { getPostAuthPath } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";
import { Link, useRouter } from "@/i18n/routing";
import { PasswordInput } from "@/features/auth/components/password-input";

type Step = 1 | 2 | 3 | 4;
type ChurchRelationship = "EXISTING" | "NEW_TO_CHURCH" | "VISITOR" | "RETURNING";

const INTEREST_OPTIONS = [
  { value: "CHOIR", labelKey: "interestChoir" as const },
  { value: "PROTOCOL", labelKey: "interestProtocol" as const },
  { value: "YOUTH", labelKey: "interestYouth" as const },
  { value: "WOMEN", labelKey: "interestWomen" as const },
  { value: "MEN", labelKey: "interestMen" as const },
  { value: "INTERCESSORS", labelKey: "interestIntercessors" as const },
  { value: "CHILDREN", labelKey: "interestChildren" as const },
];

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [churchRelationship, setChurchRelationship] =
    useState<ChurchRelationship>("NEW_TO_CHURCH");
  const [relationshipNotes, setRelationshipNotes] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

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
        churchRelationship,
        interests,
        relationshipNotes: relationshipNotes.trim() || undefined,
        preferredLanguage: locale,
      });
      await trackUxEvent("signup_completed", { interests, churchRelationship });
      const profile = await fetchCurrentUser();
      setSession({ accessToken, profile });
      router.replace(getPostAuthPath(profile));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, ta("registerFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  const relationshipLabel = {
    EXISTING: t("relationshipExisting"),
    NEW_TO_CHURCH: t("relationshipNew"),
    VISITOR: t("relationshipVisitor"),
    RETURNING: t("relationshipReturning"),
  }[churchRelationship];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2" aria-hidden>
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
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t("stepIdentityTitle")}
          </h2>
          <CmmsInput
            id="firstName"
            label={t("firstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
          <CmmsInput
            id="lastName"
            label={t("lastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
          <CmmsInput
            id="email"
            type="email"
            label={ta("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <CmmsInput
            id="phone"
            type="tel"
            label={t("phone")}
            hint={t("phoneOptional")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
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

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t("stepRelationshipTitle")}
          </h2>
          <CmmsFormField label={t("stepRelationshipTitle")} required>
            <CmmsSelect
              value={churchRelationship}
              onChange={(e) => setChurchRelationship(e.target.value as ChurchRelationship)}
            >
              <option value="EXISTING">{t("relationshipExisting")}</option>
              <option value="NEW_TO_CHURCH">{t("relationshipNew")}</option>
              <option value="VISITOR">{t("relationshipVisitor")}</option>
              <option value="RETURNING">{t("relationshipReturning")}</option>
            </CmmsSelect>
          </CmmsFormField>
          <CmmsInput
            id="relationshipNotes"
            label={t("relationshipNotes")}
            hint={t("relationshipNotesHint")}
            value={relationshipNotes}
            onChange={(e) => setRelationshipNotes(e.target.value)}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t("stepInterestsTitle")}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">{t("interestsHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={interests.includes(option.value)}
                  onChange={() => toggleInterest(option.value)}
                  className="size-4 accent-[var(--primary)]"
                />
                {t(option.labelKey)}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t("stepReviewTitle")}
          </h2>
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
              <dt className="text-[var(--muted-foreground)]">{t("reviewRelationship")}</dt>
              <dd className="font-medium text-[var(--foreground)]">{relationshipLabel}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("reviewInterests")}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {interests.length
                  ? interests
                      .map((i) => INTEREST_OPTIONS.find((o) => o.value === i)?.labelKey)
                      .filter(Boolean)
                      .map((key) => t(key!))
                      .join(", ")
                  : t("reviewNone")}
              </dd>
            </div>
          </dl>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {t("approvalExplanation")}
          </p>
        </div>
      ) : null}

      {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <CmmsButton
            type="button"
            variant="secondary"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            {t("back")}
          </CmmsButton>
        ) : null}
        {step < 4 ? (
          <CmmsButton
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={
              (step === 1 &&
                (!firstName ||
                  !lastName ||
                  !email ||
                  password.length < 6 ||
                  password !== confirmPassword))
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
