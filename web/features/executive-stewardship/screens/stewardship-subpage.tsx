"use client";

import { useTranslations } from "next-intl";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { StewardshipMobileNav } from "@/features/executive-stewardship/components/StewardshipMobileNav";

export function StewardshipSubpageLayout({
  titleKey,
  children,
  loading,
  error,
}: Readonly<{
  titleKey: "campaigns" | "families" | "contributors" | "needsAttention" | "adjustments";
  children: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}>) {
  const t = useTranslations(`executiveStewardship.${titleKey}`);

  return (
    <OperationalScreen className="cmms-content-wide space-y-6 pb-24 lg:pb-8">
      <header>
        <Link
          href="/dashboard/stewardship"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      {loading ? <DashboardStateCard title={t("title")} message={t("loading")} /> : null}
      {error ? <DashboardStateCard title={t("title")} message={t("loadError")} /> : null}
      {!loading && !error ? children : null}

      <StewardshipMobileNav />
    </OperationalScreen>
  );
}
