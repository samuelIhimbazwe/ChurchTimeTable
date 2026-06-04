"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { fetchDevotions } from "@/core/api/http";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsButton } from "@/components/ui/cmms-button";

type Filter = "all" | "VERSE_OF_DAY" | "ENCOURAGEMENT" | "ANNOUNCEMENT" | "pinned";

export function DevotionsPage() {
  const t = useTranslations("devotions");
  const [filter, setFilter] = useState<Filter>("all");

  const query = useQuery({
    queryKey: ["devotions", filter],
    queryFn: () =>
      fetchDevotions(
        filter === "all"
          ? undefined
          : filter === "pinned"
            ? { pinned: "true" }
            : { type: filter },
      ),
  });

  const filters: Filter[] = [
    "all",
    "pinned",
    "VERSE_OF_DAY",
    "ENCOURAGEMENT",
    "ANNOUNCEMENT",
  ];

  return (
    <div className="cmms-page-stack">
      <div>
        <h1 className="cmms-text-display text-[var(--foreground)]">{t("pageTitle")}</h1>
        <p className="cmms-text-body mt-1 text-[var(--muted-foreground)]">{t("pageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <CmmsButton
            key={f}
            type="button"
            size="sm"
            variant={filter === f ? "primary" : "secondary"}
            onClick={() => setFilter(f)}
          >
            {t(`filter.${f}`)}
          </CmmsButton>
        ))}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
      ) : null}

      <div className="grid gap-4">
        {(query.data ?? []).map((item) => (
          <CmmsCard key={item.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                {t(`type.${item.type}`)}
              </span>
              {item.isPinned ? (
                <span className="rounded bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                  {t("pinned")}
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{item.title}</h2>
            {item.verseReference ? (
              <p className="mt-1 text-sm font-medium text-[var(--primary)]">{item.verseReference}</p>
            ) : null}
            {item.verseText ? (
              <p className="mt-2 text-sm italic text-[var(--muted-foreground)]">{item.verseText}</p>
            ) : null}
            <p className="mt-3 text-sm text-[var(--foreground)]">{item.content}</p>
          </CmmsCard>
        ))}
      </div>
    </div>
  );
}
