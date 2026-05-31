import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

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
              CMMS
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
              {t("forgotPasswordTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {t("forgotPasswordDescription")}
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className={cmmsButtonStyles({
                  variant: "ghost",
                  size: "sm",
                  className: "px-0 py-0 justify-start",
                })}
              >
                {t("backToSignIn")}
              </Link>
            </div>
          </section>

          <CmmsCard title={t("forgotPasswordTitle")} description={t("forgotPasswordDescription")}>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {t("forgotPasswordPlaceholder")}
            </p>
            <Link href="/login" className="mt-6 inline-flex text-sm font-medium text-[var(--primary)]">
              {t("backToSignIn")}
            </Link>
          </CmmsCard>
        </div>
      </main>
    </GuestRoute>
  );
}
