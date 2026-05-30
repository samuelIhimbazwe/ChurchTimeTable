"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutRequest } from "@/core/api/http";
import { isPendingMember } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";
import { Link, useRouter } from "@/i18n/routing";

export function PendingApprovalScreen() {
  const t = useTranslations("onboarding.pending");
  const tc = useTranslations("common");
  const profile = useSessionStore((state) => state.profile);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (profile && !isPendingMember(profile)) {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutRequest();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = [profile?.member?.firstName, profile?.member?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="cmms-page flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 flex justify-end gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-xs)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {t("title")}
          </h1>
          {displayName ? (
            <p className="mt-2 text-base text-[var(--muted-foreground)]">
              {t("greeting", { name: displayName })}
            </p>
          ) : null}
          <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
            {t("body")}
          </p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[var(--foreground)]">
            <li>{t("stepReview")}</li>
            <li>{t("stepNotify")}</li>
            <li>{t("stepAccess")}</li>
          </ul>
          <p className="mt-6 rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]">
            {t("helpHint")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CmmsButton
              type="button"
              variant="secondary"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? tc("loading") : tc("logout")}
            </CmmsButton>
            <Link href="/login" className="inline-flex items-center text-sm text-[var(--primary)]">
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
