"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMusicAnalytics, fetchMusicSongs } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function MusicPage() {
  const t = useTranslations("music");

  const analyticsQuery = useQuery({
    queryKey: ["music", "analytics"],
    queryFn: fetchMusicAnalytics,
  });

  const songsQuery = useQuery({
    queryKey: ["music", "songs"],
    queryFn: () => fetchMusicSongs({ limit: 50 }),
  });

  return (
    <OperationalScreen title={t("title")} subtitle={t("description")}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/music/analytics">
          <CmmsButton variant="secondary">{t("analyticsNav")}</CmmsButton>
        </Link>
        <Link href="/dashboard/music/favorites">
          <CmmsButton variant="secondary">{t("favoritesNav")}</CmmsButton>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStateCard
          label={t("totalSongs")}
          value={analyticsQuery.data?.totalSongs ?? 0}
          loading={analyticsQuery.isLoading}
        />
        <DashboardStateCard
          label={t("popularSongs")}
          value={analyticsQuery.data?.mostUsed?.length ?? 0}
          loading={analyticsQuery.isLoading}
        />
        <DashboardStateCard
          label={t("recentSongs")}
          value={analyticsQuery.data?.recentSongs?.length ?? 0}
          loading={analyticsQuery.isLoading}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">{t("songList")}</h2>
        <ul className="mt-3 space-y-2">
          {(songsQuery.data?.items ?? []).map((song) => (
            <li
              key={song.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <Link
                href={`/dashboard/music/${song.id}`}
                className="flex-1 hover:underline"
              >
                <p className="font-medium">{song.title}</p>
                <p className="text-xs text-muted-foreground">
                  {song.composer ?? t("unknownComposer")} ·{" "}
                  {song.category?.name ?? t("uncategorized")}
                </p>
              </Link>
              <span className="text-xs text-muted-foreground">
                {t("usageCount", { count: song.usageCount })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </OperationalScreen>
  );
}
