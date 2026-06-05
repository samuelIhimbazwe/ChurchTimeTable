"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { getApiErrorMessage } from "@/core/api/errors";
import { useMemberPortalDashboard } from "@/features/member-portal/hooks/use-member-portal";
import { FirstLoginWelcome } from "@/features/auth/components/first-login-welcome";

export function ChurchMemberPortalDashboard() {
  const t = useTranslations("memberPortal");
  const query = useMemberPortalDashboard();

  if (query.isLoading) return <CmmsDashboardSkeleton />;
  if (query.isError || !query.data) {
    return (
      <CmmsCard title={t("title")}>
        <p className="text-sm text-[var(--muted-foreground)]">
          {getApiErrorMessage(query.error, t("loadError"))}
        </p>
      </CmmsCard>
    );
  }

  const data = query.data as {
    spiritual?: {
      verseOfDay?: { title?: string; verseText?: string };
      livestream?: { title?: string } | null;
      upcomingServices?: Array<{ title: string; startAt?: string }>;
      recentSermons?: Array<{ title: string }>;
    };
    activities?: {
      upcomingEvents?: Array<{ title: string }>;
      announcements?: Array<{ title: string }>;
    };
    membership?: {
      myChoirs?: Array<{ choir: { name: string } }>;
      myMinistries?: Array<{ ministry: { name: string } }>;
      protocolStatus?: string;
      pendingJoinRequests?: unknown[];
      protocolInvitations?: unknown[];
    };
  };

  const requestCount = data.membership?.pendingJoinRequests?.length ?? 0;
  const invitationCount = data.membership?.protocolInvitations?.length ?? 0;

  return (
    <>
      <FirstLoginWelcome />
      <div className="cmms-page-stack">
        <CmmsCard title={t("spiritual")}>
          <p className="text-sm font-medium">
            {data.spiritual?.verseOfDay?.title ?? t("verseOfDay")}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {data.spiritual?.verseOfDay?.verseText ?? "—"}
          </p>
        </CmmsCard>

        <CmmsCard title={t("churchLife")}>
          {(data.spiritual?.upcomingServices ?? []).length ||
          (data.activities?.upcomingEvents ?? []).length ? (
            <ul className="space-y-2 text-sm">
              {(data.spiritual?.upcomingServices ?? []).slice(0, 3).map((s, i) => (
                <li key={`svc-${i}`}>
                  {t("servicePrefix")}: {s.title}
                </li>
              ))}
              {(data.activities?.upcomingEvents ?? []).slice(0, 3).map((e, i) => (
                <li key={`evt-${i}`}>
                  {t("eventPrefix")}: {e.title}
                </li>
              ))}
            </ul>
          ) : (
            <CmmsEmptyState
              title={t("noUpcomingEvents")}
              description={t("noUpcomingEventsHint")}
            />
          )}
          {(data.activities?.announcements ?? []).length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {t("announcements")}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.activities!.announcements!.slice(0, 3).map((a, i) => (
                  <li key={i}>{a.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CmmsCard>

        <CmmsCard title={t("media")}>
          {data.spiritual?.livestream ? (
            <p className="text-sm">
              <span className="font-medium text-[var(--primary)]">{t("livePrefix")}: </span>
              {data.spiritual.livestream.title}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/live" className="text-[var(--primary)] hover:underline">
              {t("watchLive")}
            </Link>
            <Link href="/broadcasts" className="text-[var(--primary)] hover:underline">
              {t("recentSermons")}
            </Link>
          </div>
        </CmmsCard>

        <CmmsCard title={t("participation")}>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("myChoir")}</dt>
              <dd>
                {(data.membership?.myChoirs ?? []).map((m) => m.choir.name).join(", ") ||
                  t("noneYet")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("protocol")}</dt>
              <dd>
                {data.membership?.protocolStatus === "ACTIVE"
                  ? t("protocolActive")
                  : t("protocolInactive")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">{t("ministries")}</dt>
              <dd>
                {(data.membership?.myMinistries ?? [])
                  .map((m) => m.ministry.name)
                  .join(", ") || t("noneYet")}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/choirs" className="text-[var(--primary)] hover:underline">
              {t("discoverChoirs")}
            </Link>
            <Link href="/protocol" className="text-[var(--primary)] hover:underline">
              {t("protocolInfo")}
            </Link>
            <Link href="/membership" className="text-[var(--primary)] hover:underline">
              {t("membershipCenter")}
            </Link>
          </div>
        </CmmsCard>

        <CmmsCard title={t("activity")}>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/my-requests" className="text-[var(--primary)] hover:underline">
              {t("myRequests", { count: requestCount })}
            </Link>
            <Link href="/my-invitations" className="text-[var(--primary)] hover:underline">
              {t("invitations", { count: invitationCount })}
            </Link>
            <Link href="/dashboard/notifications" className="text-[var(--primary)] hover:underline">
              {t("notifications")}
            </Link>
          </div>
        </CmmsCard>
      </div>
    </>
  );
}
