import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ redirect?: string }>;
}>) {
  const t = await getTranslations();
  const { redirect } = await searchParams;

  return (
    <GuestRoute>
      <main className="cmms-page flex min-h-screen items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="cmms-panel p-8">
            <div className="flex flex-wrap justify-end gap-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              {t("foundation.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
              {t("auth.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {t("auth.subtitle")}
            </p>
            <p className="mt-6 text-sm text-[var(--muted-foreground)]">
              {t("auth.hint")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className={cmmsButtonStyles({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                {t("auth.createAccount")}
              </Link>
              <Link
                href="/"
                className={cmmsButtonStyles({
                  variant: "ghost",
                  size: "sm",
                  className: "px-0 py-0 justify-start",
                })}
              >
                {t("common.backHome")}
              </Link>
            </div>
          </section>

          <CmmsCard title={t("auth.signInCard")} description={t("auth.subtitle")}>
            <LoginForm redirectTo={redirect} />
          </CmmsCard>
        </div>
      </main>
    </GuestRoute>
  );
}
