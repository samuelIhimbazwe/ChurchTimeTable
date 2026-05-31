"use client";



import { useTranslations } from "next-intl";



import { CmmsAlert } from "@/components/ui/cmms-alert";

import { cmmsButtonStyles } from "@/components/ui/cmms-button";

import type { AuthProfile } from "@/core/api/types";

import {

  getPhoneEnforcementMode,

  isStrictPhoneBlocked,

  memberMissingPhone,

} from "@/core/auth/phone-enforcement";

import { Link } from "@/i18n/routing";



export function PhoneMigrationBanner({

  profile,

}: Readonly<{

  profile: AuthProfile;

}>) {

  const t = useTranslations("profile");



  if (!memberMissingPhone(profile)) {

    return null;

  }



  const mode = getPhoneEnforcementMode(profile);

  const strictBlocked = isStrictPhoneBlocked(profile);



  if (mode === "warning") {

    return (

      <CmmsAlert

        variant="warning"

        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"

      >

        <p>{t("warningPhoneIncomplete")}</p>

        <Link

          href="/dashboard/settings/profile"

          className={cmmsButtonStyles({ variant: "secondary", size: "sm" })}

        >

          {t("updatePhoneNow")}

        </Link>

      </CmmsAlert>

    );

  }



  if (strictBlocked) {

    return (

      <CmmsAlert

        variant="error"

        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"

      >

        <p>{t("restrictedUntilPhoneAdded")}</p>

        <Link

          href="/dashboard/settings/profile"

          className={cmmsButtonStyles({ variant: "primary", size: "sm" })}

        >

          {t("updatePhoneNow")}

        </Link>

      </CmmsAlert>

    );

  }



  return (

    <CmmsAlert

      variant="info"

      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"

    >

      <p>{t("phoneBannerMessage")}</p>

      <Link

        href="/dashboard/settings/profile"

        className={cmmsButtonStyles({ variant: "secondary", size: "sm" })}

      >

        {t("phoneBannerAction")}

      </Link>

    </CmmsAlert>

  );

}


