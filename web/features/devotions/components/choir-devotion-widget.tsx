"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { fetchDevotionWidget } from "@/core/api/http";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsButton } from "@/components/ui/cmms-button";
import { Link } from "@/i18n/routing";

export function ChoirDevotionWidget() {
  const t = useTranslations("devotions");
  const [expanded, setExpanded] = useState(false);
  const query = useQuery({
    queryKey: ["devotion-widget"],
    queryFn: fetchDevotionWidget,
  });

  if (query.isLoading) {
    return (
      <CmmsCard className="animate-pulse p-4">
        <div className="h-4 w-1/3 rounded bg-[var(--muted)]" />
        <div className="mt-3 h-16 rounded bg-[var(--muted)]" />
      </CmmsCard>
    );
  }

  const { pinned, verseOfDay, encouragement } = query.data ?? {};
  const hasContent = pinned || verseOfDay || encouragement;

  if (!hasContent) {
    return null;
  }

  return (
    <CmmsCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t("widgetTitle")}
        </h2>
        <div className="flex items-center gap-2">
          <CmmsButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t("collapse") : t("expand")}
          </CmmsButton>
          <Link
            href="/dashboard/devotions"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {pinned ? (
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("pinned")}
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">{pinned.title}</p>
            {expanded ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{pinned.content}</p>
            ) : null}
          </section>
        ) : null}

        {verseOfDay ? (
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("verseOfDay")}
            </p>
            {verseOfDay.verseReference ? (
              <p className="mt-1 font-medium text-[var(--foreground)]">
                {verseOfDay.verseReference}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {expanded
                ? verseOfDay.verseText ?? verseOfDay.content
                : (verseOfDay.verseText ?? verseOfDay.content).slice(0, 120)}
            </p>
          </section>
        ) : null}

        {encouragement && !expanded ? (
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("encouragement")}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{encouragement.title}</p>
          </section>
        ) : null}

        {encouragement && expanded ? (
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("encouragement")}
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">{encouragement.title}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{encouragement.content}</p>
          </section>
        ) : null}
      </div>
    </CmmsCard>
  );
}
