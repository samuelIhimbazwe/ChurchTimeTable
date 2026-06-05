import { getTranslations } from "next-intl/server";

import { GuestRoute } from "@/components/auth/guest-route";
import { BrandedGuestAside } from "@/components/branding/branded-guest-aside";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { Link } from "@/i18n/routing";
import { SignupForm } from "@/features/auth/components/signup-form";

export default async function RegisterPage() {
  const t = await getTranslations();

  return (
    <GuestRoute>
      <main className="cmms-page flex min-h-screen items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_460px]">
          <BrandedGuestAside
            eyebrow={t("onboarding.signup.eyebrow")}
            title={t("onboarding.signup.pageTitle")}
            description={t("onboarding.signup.pageSubtitle")}
            footer={
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
            }
          />

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
