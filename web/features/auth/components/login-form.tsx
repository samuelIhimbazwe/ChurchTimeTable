"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  fetchCurrentUser,
  getApiErrorMessage,
  loginRequest,
} from "@/core/api/http";
import { useSessionStore } from "@/core/auth/session-store";
import { useRouter } from "@/i18n/routing";

export function LoginForm({
  redirectTo,
}: Readonly<{
  redirectTo?: string;
}>) {
  const t = useTranslations("auth");
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const accessToken = await loginRequest(email, password);
      const profile = await fetchCurrentUser();
      setSession({ accessToken, profile });
      router.replace(normalizeRedirectPath(redirectTo));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, t("invalidCredentials")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CmmsInput
        id="email"
        type="email"
        label={t("email")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="admin@church.local"
        required
      />
      <CmmsInput
        id="password"
        type="password"
        label={t("password")}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
        required
      />
      {error ? (
        <p className="rounded-[var(--radius-xl)] bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <CmmsButton
        type="submit"
        disabled={submitting}
        fullWidth
      >
        {submitting ? t("submit") : t("submit")}
      </CmmsButton>
    </form>
  );
}

function normalizeRedirectPath(redirectTo?: string) {
  if (!redirectTo || redirectTo === "/") {
    return "/dashboard";
  }

  return redirectTo.replace(/^\/(en|fr|rw)(?=\/|$)/, "") || "/dashboard";
}
