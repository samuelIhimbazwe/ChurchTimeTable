import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";

export default async function LocalizedNotFoundPage() {
  const t = await getTranslations();

  return (
    <main className="cmms-page flex min-h-screen items-center justify-center">
      <div className="cmms-panel max-w-lg space-y-6 p-8 text-center">
        <p className="cmms-text-label uppercase tracking-[0.2em] text-[var(--primary)]">404</p>
        <h1 className="cmms-text-display text-[var(--foreground)]">{t("common.notFound")}</h1>
        <p className="cmms-text-body text-[var(--muted-foreground)]">{t("common.backHome")}</p>
        <Link
          href="/"
          className={cmmsButtonStyles({ variant: "primary", size: "md", className: "inline-flex" })}
        >
          {t("common.backHome")}
        </Link>
      </div>
    </main>
  );
}
