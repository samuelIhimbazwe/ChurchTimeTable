import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";
import { ChurchWelcomeHero } from "@/features/auth/components/church-welcome-hero";

export default async function WelcomePage() {
  const t = await getTranslations("landing");

  return (
    <GuestRoute>
      <main className="cmms-page min-h-screen">
        <div className="flex flex-wrap justify-end gap-3 p-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <ChurchWelcomeHero />
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4 px-6 pb-12">
          <Link href="/register" className={cmmsButtonStyles({ variant: "primary" })}>
            {t("createAccount")}
          </Link>
          <Link href="/login" className={cmmsButtonStyles({ variant: "secondary" })}>
            {t("signIn")}
          </Link>
        </div>
      </main>
    </GuestRoute>
  );
}
