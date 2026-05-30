import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/routing";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <GuestRoute>
      <main className="cmms-page flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-end gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
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
