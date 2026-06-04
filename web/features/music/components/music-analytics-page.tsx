"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsCard } from "@/components/ui/cmms-card";
import { fetchMusicAnalytics } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function MusicAnalyticsPage() {
  const t = useTranslations("music");
  const query = useQuery({
    queryKey: ["music", "analytics"],
    queryFn: fetchMusicAnalytics,
  });
  const data = query.data;

  return (
    <OperationalScreen title={t("analyticsTitle")} subtitle={t("analyticsSubtitle")}>
      <Link href="/dashboard/music" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToLibrary")}
      </Link>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CmmsCard title={t("mostUsed")}>
            <ul className="space-y-1 text-sm">
              {(data?.mostUsed ?? []).map((row) => (
                <li key={row.songId}>
                  {row.title} ({row.usageCount})
                </li>
              ))}
            </ul>
          </CmmsCard>
          <CmmsCard title={t("leastUsed")}>
            <ul className="space-y-1 text-sm">
              {(data?.leastUsed ?? []).map((row) => (
                <li key={row.songId}>
                  {row.title} ({row.usageCount})
                </li>
              ))}
            </ul>
          </CmmsCard>
          <CmmsCard title={t("byCategory")}>
            <ul className="space-y-1 text-sm">
              {(data?.categoryDistribution ?? []).map((row, i) => (
                <li key={row.categoryId ?? `cat-${i}`}>
                  {row.categoryId ?? t("uncategorized")}: {row._count}
                </li>
              ))}
            </ul>
          </CmmsCard>
          <CmmsCard title={t("recentSongs")}>
            <ul className="space-y-1 text-sm">
              {(data?.recentSongs ?? []).map((row) => (
                <li key={row.id}>{row.title}</li>
              ))}
            </ul>
          </CmmsCard>
        </div>
      )}
    </OperationalScreen>
  );
}
