import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";
import { SignupForm } from "@/features/auth/components/signup-form";

export default async function RegisterPage() {
  const t = await getTranslations();

  return (
    <GuestRoute>
      <main className="cmms-page flex min-h-screen items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_460px]">
          <section className="cmms-panel p-8">
            <div className="flex flex-wrap justify-end gap-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              {t("onboarding.signup.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
              {t("onboarding.signup.pageTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {t("onboarding.signup.pageSubtitle")}
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
                {t("auth.haveAccount")}
              </Link>
            </div>
          </section>

          <CmmsCard
            title={t("onboarding.signup.cardTitle")}
            description={t("onboarding.signup.cardSubtitle")}
          >
            <SignupForm />
          </CmmsCard>
        </div>
      </main>
    </GuestRoute>
  );
}
