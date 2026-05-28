import { getTranslations } from "next-intl/server";

import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";
import { ApiStatusCard } from "@/features/foundation/components/api-status-card";

export default async function LocalizedHomePage() {
  const t = await getTranslations();

  return (
    <main className="cmms-page flex min-h-screen flex-col">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {t("foundation.eyebrow")}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            {t("foundation.title")}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            {t("foundation.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="cmms-panel p-8">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                {t("app.tagline")}
              </p>
              <p className="text-lg leading-8 text-[var(--muted-foreground)]">
                {t("app.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className={cmmsButtonStyles({ variant: "primary", size: "lg" })}
              >
                {t("foundation.loginCta")}
              </Link>
              <Link
                href="/dashboard"
                className={cmmsButtonStyles({ variant: "secondary", size: "lg" })}
              >
                {t("foundation.dashboardCta")}
              </Link>
            </div>
          </div>
        </div>

        <ApiStatusCard />
      </section>
    </main>
  );
}
