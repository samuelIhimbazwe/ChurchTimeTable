"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { fetchMusicSong, toggleMusicFavorite } from "@/core/api/http";
import { Link } from "@/i18n/routing";

function AssetPreview({
  asset,
}: Readonly<{
  asset: { fileName: string; fileUrl: string; mimeType: string | null; assetType: string };
}>) {
  const mime = asset.mimeType ?? "";
  if (mime.includes("pdf")) {
    return (
      <iframe
        title={asset.fileName}
        src={asset.fileUrl}
        className="h-96 w-full rounded-md border border-border"
      />
    );
  }
  if (mime.startsWith("audio/")) {
    return <audio controls className="w-full" src={asset.fileUrl} />;
  }
  if (mime.startsWith("video/")) {
    return <video controls className="w-full max-h-96" src={asset.fileUrl} />;
  }
  return (
    <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">
      {asset.fileName}
    </a>
  );
}

export function MusicSongDetail({ songId }: Readonly<{ songId: string }>) {
  const t = useTranslations("music");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("details");

  const songQuery = useQuery({
    queryKey: ["music", "song", songId],
    queryFn: () => fetchMusicSong(songId),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => toggleMusicFavorite(songId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["music", "song", songId] });
    },
  });

  const song = songQuery.data;
  const tabs = [
    { id: "details", label: t("tabDetails") },
    { id: "lyrics", label: t("lyrics") },
    { id: "assets", label: t("assets") },
    { id: "usage", label: t("usageHistory") },
  ];

  return (
    <OperationalScreen title={song?.title ?? t("loading")} subtitle={t("detailDescription")}>
      <Link href="/dashboard/music" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToLibrary")}
      </Link>
      <CmmsButton
        variant="secondary"
        className="mb-4"
        disabled={favoriteMutation.isPending}
        onClick={() => favoriteMutation.mutate()}
      >
        {song?.isFavorite ? t("unfavorite") : t("favorite")}
      </CmmsButton>
      <CmmsTabs items={tabs} activeId={tab} onChange={setTab} />
      {song && tab === "details" ? (
        <CmmsCard title={t("metadata")} className="mt-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("composer")}</dt>
              <dd>{song.composer ?? t("unknownComposer")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("language")}</dt>
              <dd>{song.language ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("category")}</dt>
              <dd>{song.category?.name ?? t("uncategorized")}</dd>
            </div>
          </dl>
        </CmmsCard>
      ) : null}
      {song && tab === "lyrics" ? (
        <CmmsCard title={t("lyrics")} className="mt-4 print:border-none">
          <CmmsButton variant="secondary" className="mb-3 print:hidden" onClick={() => window.print()}>
            {t("printLyrics")}
          </CmmsButton>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {song.lyricsText ?? t("noLyrics")}
          </pre>
        </CmmsCard>
      ) : null}
      {song && tab === "assets" ? (
        <div className="mt-4 space-y-4">
          {song.assets.map((asset) => (
            <CmmsCard key={asset.id} title={`${asset.fileName} (${asset.assetType})`}>
              <AssetPreview asset={asset} />
              {asset.mimeType?.includes("pdf") ? (
                <CmmsButton
                  variant="secondary"
                  className="mt-2 print:hidden"
                  onClick={() => window.print()}
                >
                  {t("printSheetMusic")}
                </CmmsButton>
              ) : null}
            </CmmsCard>
          ))}
        </div>
      ) : null}
      {song && tab === "usage" ? (
        <CmmsCard title={t("usageHistory")} className="mt-4">
          <ul className="space-y-2 text-sm">
            {song.usageRecords.map((row, index) => (
              <li key={`${row.event.id}-${index}`}>
                {row.event.title} · {new Date(row.usedAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </CmmsCard>
      ) : null}
    </OperationalScreen>
  );
}
