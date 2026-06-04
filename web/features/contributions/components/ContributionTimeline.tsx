"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import type { ContributionTimelineEvent } from "@/features/contributions/types";

function eventLabelKey(type: string): string {
  const map: Record<string, string> = {
    submitted: "submitted",
    approved: "approved",
    rejected: "rejected",
    adjusted: "adjusted",
    family_changed: "familyChanged",
    type_changed: "typeChanged",
    campaign_changed: "campaignChanged",
    thank_you_sent: "thankYouSent",
    ledger_posted: "ledgerPosted",
  };
  return map[type] ?? type;
}

export function ContributionTimeline({
  events,
  isLoading,
}: Readonly<{
  events: ContributionTimelineEvent[];
  isLoading?: boolean;
}>) {
  const t = useTranslations("contributions.timeline");

  if (isLoading) {
    return (
      <CmmsCard title={t("title")}>
        <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
      </CmmsCard>
    );
  }

  if (events.length === 0) {
    return (
      <CmmsCard title={t("title")}>
        <p className="text-sm text-[var(--muted-foreground)]">{t("empty")}</p>
      </CmmsCard>
    );
  }

  return (
    <CmmsCard title={t("title")} description={t("hint")}>
      <ol className="relative space-y-0 border-s border-[var(--border)] ps-6">
        {events.map((event, index) => (
          <li key={`${event.type}-${event.timestamp}-${index}`} className="pb-6 last:pb-0">
            <span
              className="absolute -start-1.5 mt-1.5 size-3 rounded-full border-2 border-[var(--surface)] bg-[var(--primary)]"
              aria-hidden
            />
            <time
              dateTime={event.timestamp}
              className="text-xs text-[var(--muted-foreground)]"
            >
              {new Date(event.timestamp).toLocaleString()}
            </time>
            <p className="mt-1 font-medium text-[var(--foreground)]">
              {t(`events.${eventLabelKey(event.type)}`, {
                defaultValue: event.summary,
              })}
            </p>
            {event.summary && event.summary !== t(`events.${eventLabelKey(event.type)}`) ? (
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                {event.summary}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </CmmsCard>
  );
}
