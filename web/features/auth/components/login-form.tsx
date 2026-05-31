"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  fetchCurrentUser,
  getApiErrorMessage,
  loginRequest,
} from "@/core/api/http";
import { getPostAuthPath } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";
import { Link, useRouter } from "@/i18n/routing";
import { PasswordInput } from "@/features/auth/components/password-input";

export function LoginForm({
  redirectTo,
}: Readonly<{
  redirectTo?: string;
}>) {
  const t = useTranslations("auth");
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const consumeSessionEndReason = useSessionStore((state) => state.consumeSessionEndReason);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    const reason = consumeSessionEndReason();
    if (reason === "expired") {
      setSessionNotice(t("sessionExpired"));
    }
  }, [consumeSessionEndReason, t]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSessionNotice(null);

    try {
      const accessToken = await loginRequest(email, password);
      const profile = await fetchCurrentUser();
      setSession({ accessToken, profile });
      router.replace(normalizeRedirectPath(redirectTo, profile));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, t("invalidCredentials")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sessionNotice ? <CmmsAlert variant="warning">{sessionNotice}</CmmsAlert> : null}
      <CmmsInput
        id="email"
        type="email"
        label={t("email")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <PasswordInput
        id="password"
        label={t("password")}
        value={password}
        onChange={setPassword}
        required
      />
      {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
      <CmmsButton type="submit" disabled={submitting} fullWidth>
        {submitting ? t("submitting") : t("submit")}
      </CmmsButton>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-[var(--primary)]">
          {t("createAccount")}
        </Link>
      </p>
      <p className="text-center text-xs text-[var(--muted-foreground)]">
        <Link href="/forgot-password" className="hover:text-[var(--foreground)]">
          {t("forgotPassword")}
        </Link>
      </p>
    </form>
  );
}

function normalizeRedirectPath(redirectTo: string | undefined, profile: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  if (profile && profile.member?.status === "PENDING") {
    return "/pending-approval";
  }

  if (!redirectTo || redirectTo === "/") {
    return getPostAuthPath(profile);
  }

  return redirectTo.replace(/^\/(en|fr|rw)(?=\/|$)/, "") || getPostAuthPath(profile);
}
