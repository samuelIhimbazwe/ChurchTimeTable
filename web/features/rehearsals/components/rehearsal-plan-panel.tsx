"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  fetchMusicSongs,
  fetchRehearsalPlan,
  getApiErrorMessage,
  upsertRehearsalPlan,
} from "@/core/api/http";
import { canManageRehearsals } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";

export function RehearsalPlanPanel({
  eventId,
}: Readonly<{
  eventId: string;
}>) {
  const t = useTranslations("rehearsals");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageRehearsals(profile?.permissions ?? []);
  const queryClient = useQueryClient();
  const [objectives, setObjectives] = useState("");
  const [notes, setNotes] = useState("");
  const [songId, setSongId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ["rehearsals", "plan", eventId],
    queryFn: () => fetchRehearsalPlan(eventId),
  });

  const songsQuery = useQuery({
    queryKey: ["music", "songs", "plan-picker"],
    queryFn: () => fetchMusicSongs({ limit: 100 }),
    enabled: canManage,
  });

  useEffect(() => {
    const plan = planQuery.data as Record<string, unknown> | undefined;
    if (!plan) return;
    setObjectives((plan.objectives as string) ?? "");
    setNotes((plan.notes as string) ?? "");
  }, [planQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const existingSongs =
        ((planQuery.data as { songs?: Array<{ songId: string; sortOrder: number }> })
          ?.songs ?? []) as Array<{ songId: string; sortOrder: number }>;
      const songs = songId
        ? [
            ...existingSongs.filter((s) => s.songId !== songId),
            { songId, sortOrder: existingSongs.length },
          ]
        : existingSongs;
      return upsertRehearsalPlan(eventId, { objectives, notes, songs });
    },
    onSuccess: async () => {
      setSongId("");
      await queryClient.invalidateQueries({ queryKey: ["rehearsals", "plan", eventId] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const planSongs =
    (planQuery.data as { songs?: Array<{ sortOrder: number; song?: { title: string }; songId: string }> })
      ?.songs ?? [];

  return (
    <div className="cmms-section-stack border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{t("planTitle")}</h3>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {planQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <>
          <CmmsFormField label={t("objectives")} htmlFor="objectives">
            <CmmsInput
              id="objectives"
              value={objectives}
              disabled={!canManage}
              onChange={(e) => setObjectives(e.target.value)}
            />
          </CmmsFormField>
          <CmmsFormField label={t("planNotes")} htmlFor="planNotes">
            <CmmsInput
              id="planNotes"
              value={notes}
              disabled={!canManage}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CmmsFormField>
          <ul className="space-y-1 text-sm">
            {planSongs.map((row) => (
              <li key={row.songId}>
                {row.sortOrder + 1}. {row.song?.title ?? row.songId}
              </li>
            ))}
          </ul>
          {canManage ? (
            <div className="flex flex-wrap items-end gap-2">
              <CmmsFormField label={t("addSong")} htmlFor="songId">
                <select
                  id="songId"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={songId}
                  onChange={(e) => setSongId(e.target.value)}
                >
                  <option value="">{t("selectSong")}</option>
                  {(songsQuery.data?.items ?? []).map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>
              </CmmsFormField>
              <CmmsButton
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {t("savePlan")}
              </CmmsButton>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
