"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { fetchChurchWelcome } from "@/core/api/http";
import { Link } from "@/i18n/routing";

type WelcomeData = {
  branding?: { churchName?: string; welcomeMessage?: string; coverImageUrl?: string | null };
  verseOfDay?: { title?: string; verseText?: string; verseReference?: string };
  upcomingServices?: Array<{ id: string; title: string; startAt: string }>;
  upcomingEvents?: Array<{ id: string; title: string; startTime: string }>;
  recentBroadcasts?: Array<{ id: string; title: string; isLive?: boolean }>;
  liveBroadcast?: { id: string; title: string } | null;
};

export function ChurchWelcomeHero() {
  const t = useTranslations("landing");
  const [data, setData] = useState<WelcomeData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchChurchWelcome()
      .then((payload) => setData(payload as WelcomeData))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <CmmsEmptyState
        title={t("loadErrorTitle")}
        description={t("loadErrorDescription")}
      />
    );
  }

  if (!data) {
    return <p className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">{t("loading")}</p>;
  }

  const churchName = data.branding?.churchName ?? t("defaultChurchName");

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <header className="text-center">
        {data.branding?.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.branding.coverImageUrl}
            alt=""
            className="mx-auto mb-6 max-h-48 w-full max-w-2xl rounded-[var(--radius-xl)] object-cover"
          />
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {churchName}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
          {data.branding?.welcomeMessage ?? t("defaultWelcome")}
        </p>
      </header>

      {data.verseOfDay ? (
        <CmmsCard title={t("verseOfDay")}>
          <p className="text-sm font-medium">{data.verseOfDay.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {data.verseOfDay.verseText}
          </p>
        </CmmsCard>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <CmmsCard title={t("upcomingServices")}>
          {(data.upcomingServices ?? []).length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingServices!.map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ul>
          ) : (
            <CmmsEmptyState title={t("noServices")} description={t("noServicesHint")} />
          )}
        </CmmsCard>
        <CmmsCard title={t("upcomingEvents")}>
          {(data.upcomingEvents ?? []).length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingEvents!.map((e) => (
                <li key={e.id}>{e.title}</li>
              ))}
            </ul>
          ) : (
            <CmmsEmptyState title={t("noEvents")} description={t("noEventsHint")} />
          )}
        </CmmsCard>
      </div>

      <CmmsCard title={t("media")}>
        {data.liveBroadcast ? (
          <p className="mb-3 text-sm">
            <span className="font-medium text-[var(--primary)]">{t("liveNow")}: </span>
            {data.liveBroadcast.title}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/live" className="text-[var(--primary)] hover:underline">
            {t("watchLive")}
          </Link>
          <Link href="/broadcasts" className="text-[var(--primary)] hover:underline">
            {t("recentBroadcasts")}
          </Link>
        </div>
      </CmmsCard>
    </div>
  );
}
