import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { BrandedGuestAside } from "@/components/branding/branded-guest-aside";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
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
          <BrandedGuestAside
            eyebrow={t("foundation.eyebrow")}
            title={t("auth.title")}
            description={t("auth.subtitle")}
            footer={
              <>
                <p className="text-sm text-[var(--muted-foreground)]">{t("auth.hint")}</p>
                <div className="mt-4 flex flex-wrap gap-4">
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
              </>
            }
          />

          <CmmsCard title={t("auth.signInCard")} description={t("auth.subtitle")}>
            <LoginForm redirectTo={redirect} />
          </CmmsCard>
        </div>
      </main>
    </GuestRoute>
  );
}
