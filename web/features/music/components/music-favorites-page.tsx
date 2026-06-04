"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { fetchMusicFavorites } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function MusicFavoritesPage() {
  const t = useTranslations("music");
  const query = useQuery({
    queryKey: ["music", "favorites"],
    queryFn: fetchMusicFavorites,
  });

  return (
    <OperationalScreen title={t("favoritesTitle")} subtitle={t("favoritesSubtitle")}>
      <Link href="/dashboard/music" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToLibrary")}
      </Link>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <ul className="space-y-2">
          {(query.data ?? []).map((song) => (
            <li
              key={song.id}
              className="rounded-md border border-border px-3 py-2"
            >
              <Link href={`/dashboard/music/${song.id}`} className="font-medium hover:underline">
                {song.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {song.composer ?? t("unknownComposer")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </OperationalScreen>
  );
}
