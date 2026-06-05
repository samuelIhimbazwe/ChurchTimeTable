"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { getApiErrorMessage } from "@/core/api/http";
import { formatMemberPickerLabel } from "@/core/members/member-labels";
import {
  DashboardStatCard,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { MemberProfileEditForm } from "@/features/member-profile/components/member-profile-edit-form";
import { MemberStatusPanel } from "@/features/member-profile/components/member-status-panel";
import {
  useMemberProfileAttendanceQuery,
  useMemberProfileCenterQuery,
  useMemberProfileContributionsQuery,
  useMemberProfileWelfareQuery,
  useMemberTimelineQuery,
} from "@/features/member-profile/hooks/use-member-profile";
import { Link } from "@/i18n/routing";

type ProfileTab =
  | "overview"
  | "attendance"
  | "contributions"
  | "welfare"
  | "leadership"
  | "discipline"
  | "rehearsals"
  | "documents"
  | "timeline";

const TIMELINE_TYPES = [
  "attendance",
  "contribution",
  "welfare_case",
  "welfare_contribution",
  "welfare_assistance",
  "leadership",
  "discipline",
  "rehearsal",
  "assignment",
  "status_change",
  "announcement",
] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusVariant(status: string) {
  if (status === "ACTIVE" || status === "NEW_MEMBER") return "success" as const;
  if (status === "PROBATION" || status === "TEMPORARILY_INACTIVE") return "warning" as const;
  if (status === "SUSPENDED" || status === "DISCIPLINE") return "danger" as const;
  return "neutral" as const;
}

function memberStatusLabel(status: string, t: (key: string) => string) {
  const known = [
    "NEW_MEMBER",
    "ACTIVE",
    "PROBATION",
    "TEMPORARILY_INACTIVE",
    "SUSPENDED",
    "DISCIPLINE",
    "TRANSFERRED",
    "GRADUATED",
    "RETIRED",
    "DECEASED",
  ];
  if (known.includes(status)) return t(`status.${status}`);
  return status;
}

function timelineTypeLabel(type: string, t: (key: string) => string) {
  if ((TIMELINE_TYPES as readonly string[]).includes(type)) {
    return t(`timelineTypes.${type}`);
  }
  return type;
}

function voicePartLabel(part: string | null | undefined, t: (key: string) => string) {
  if (!part || part === "UNSPECIFIED") return t("voicePart.unspecified");
  const key = `voiceParts.${part}` as "voiceParts.SOPRANO";
  return t(key);
}

export function MemberProfileCenter({ memberId }: Readonly<{ memberId: string }>) {
  const t = useTranslations("memberProfile");
  const [tab, setTab] = useState<ProfileTab>("overview");

  const centerQuery = useMemberProfileCenterQuery(memberId);
  const timelineQuery = useMemberTimelineQuery(
    memberId,
    tab === "timeline" || tab === "rehearsals" || tab === "discipline",
  );
  const attendanceQuery = useMemberProfileAttendanceQuery(
    memberId,
    tab === "attendance" && Boolean(centerQuery.data?.capabilities.canViewAttendanceDetail),
  );
  const contributionsQuery = useMemberProfileContributionsQuery(
    memberId,
    tab === "contributions" && Boolean(centerQuery.data?.capabilities.canViewContributions),
  );
  const welfareQuery = useMemberProfileWelfareQuery(
    memberId,
    tab === "welfare" && Boolean(centerQuery.data?.capabilities.canViewWelfare),
  );

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: t("tabs.overview") },
      { id: "attendance" as const, label: t("tabs.attendance") },
      { id: "contributions" as const, label: t("tabs.contributions") },
      { id: "welfare" as const, label: t("tabs.welfare") },
      { id: "leadership" as const, label: t("tabs.leadership") },
      { id: "discipline" as const, label: t("tabs.discipline") },
      { id: "rehearsals" as const, label: t("tabs.rehearsals") },
      { id: "documents" as const, label: t("tabs.documents") },
      { id: "timeline" as const, label: t("tabs.timeline") },
    ],
    [t],
  );

  if (centerQuery.isLoading) return <CmmsDashboardSkeleton />;

  if (centerQuery.isError || !centerQuery.data) {
    return (
      <CmmsCard title={t("loadError")}>
        <CmmsEmptyState
          title={t("loadError")}
          description={getApiErrorMessage(centerQuery.error, t("loadError"))}
        />
      </CmmsCard>
    );
  }

  const data = centerQuery.data;
  const caps = data.capabilities;
  const displayName = formatMemberPickerLabel({
    memberNumber: data.member.memberNumber,
    firstName: data.member.firstName,
    lastName: data.member.lastName,
  });

  const rehearsalEvents =
    timelineQuery.data?.events.filter(
      (event) => event.type === "rehearsal" || event.metadata?.eventType === "REHEARSAL",
    ) ?? [];
  const disciplineEvents =
    timelineQuery.data?.events.filter((event) => event.type === "discipline") ?? [];

  return (
    <OperationalScreen
      title={displayName}
      subtitle={t("subtitle", {
        status: memberStatusLabel(data.member.status, t),
      })}
    >
      <div className="cmms-page-stack">
        <CmmsCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {data.member.firstName} {data.member.lastName}
              </p>
              {data.member.user?.email ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {data.member.user.email}
                </p>
              ) : null}
              {data.member.phone ? (
                <p className="text-sm text-[var(--muted-foreground)]">{data.member.phone}</p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t("fields.voicePart")}:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {voicePartLabel(data.profile?.voicePart, t)}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CmmsBadge variant={statusVariant(data.member.status)}>
                {memberStatusLabel(data.member.status, t)}
              </CmmsBadge>
              {data.family ? (
                <Link
                  href={`/dashboard/families?familyId=${data.family.familyId}`}
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {t("viewFamily")}
                </Link>
              ) : null}
            </div>
          </div>
        </CmmsCard>

        <CmmsTabs items={tabs} activeId={tab} onChange={(id) => setTab(id as ProfileTab)} />

        {tab === "overview" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardStatCard
                label={t("stats.attendance")}
                value={formatPercent(data.dashboard.attendanceScore.percentage)}
                description={data.dashboard.attendanceScore.bandLabel}
              />
              {data.dashboard.contributionSummary ? (
                <DashboardStatCard
                  label={t("stats.contributions")}
                  value={formatCurrency(
                    data.dashboard.contributionSummary.confirmedEffectiveTotal,
                  )}
                  description={t("stats.contributionsHint", {
                    count: data.dashboard.contributionSummary.confirmedCount,
                  })}
                />
              ) : null}
              {data.dashboard.welfareSummary ? (
                <DashboardStatCard
                  label={t("stats.welfare")}
                  value={data.dashboard.welfareSummary.openCases}
                  description={t("stats.welfareHint")}
                  tone={
                    data.dashboard.welfareSummary.openCases > 0 ? "warning" : "default"
                  }
                />
              ) : null}
              <DashboardStatCard
                label={t("stats.assignments")}
                value={data.dashboard.upcomingAssignments.length}
                description={t("stats.assignmentsHint")}
              />
            </div>

            {caps.canEditProfile ? (
              <MemberProfileEditForm memberId={memberId} profile={data.profile} />
            ) : null}

            {caps.canManageStatus ? (
              <MemberStatusPanel
                memberId={memberId}
                currentStatus={data.member.status}
                allowedTransitions={data.allowedStatusTransitions}
              />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <CmmsCard title={t("sections.family")}>
                {data.family ? (
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-[var(--muted-foreground)]">{t("fields.family")}</dt>
                      <dd>
                        {data.family.familyName} ({data.family.familyCode})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted-foreground)]">{t("fields.familyRole")}</dt>
                      <dd>{data.family.role}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">{t("noFamily")}</p>
                )}
              </CmmsCard>

              <CmmsCard title={t("sections.profileDetails")}>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-[var(--muted-foreground)]">{t("fields.emergencyName")}</dt>
                    <dd>{data.profile?.emergencyContactName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">{t("fields.emergencyPhone")}</dt>
                    <dd>{data.profile?.emergencyContactPhone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">{t("fields.choirJoinDate")}</dt>
                    <dd>{formatDate(data.profile?.choirJoinDate)}</dd>
                  </div>
                </dl>
              </CmmsCard>
            </div>

            <CmmsCard title={t("sections.upcoming")}>
              {data.dashboard.upcomingAssignments.length === 0 ? (
                <CmmsEmptyState title={t("noUpcoming")} description={t("noUpcomingHint")} />
              ) : (
                <CmmsTable
                  compact
                  rows={data.dashboard.upcomingAssignments}
                  columns={[
                    { key: "title", header: t("columns.event"), render: (row) => row.title },
                    { key: "type", header: t("columns.type"), render: (row) => row.type },
                    {
                      key: "when",
                      header: t("columns.when"),
                      render: (row) => formatDate(row.startTime),
                    },
                  ]}
                />
              )}
            </CmmsCard>
          </div>
        ) : null}

        {tab === "attendance" ? (
          <CmmsCard title={t("tabs.attendance")}>
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              {t("attendanceScore", {
                score: formatPercent(data.dashboard.attendanceScore.percentage),
              })}
            </p>
            {!caps.canViewAttendanceDetail ? (
              <CmmsEmptyState
                title={t("attendanceRestricted")}
                description={t("attendanceRestrictedHint")}
              />
            ) : attendanceQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : !attendanceQuery.data?.allowed ? (
              <CmmsEmptyState
                title={t("attendanceRestricted")}
                description={t("attendanceRestrictedHint")}
              />
            ) : attendanceQuery.data.records.length === 0 ? (
              <CmmsEmptyState title={t("noAttendance")} description={t("noAttendanceHint")} />
            ) : (
              <CmmsTable
                compact
                rows={attendanceQuery.data.records}
                columns={[
                  {
                    key: "event",
                    header: t("columns.event"),
                    render: (row) => row.event?.title ?? "—",
                  },
                  {
                    key: "status",
                    header: t("columns.status"),
                    render: (row) =>
                      `${row.operationalStatus ?? "—"} (${row.physicalStatus})`,
                  },
                  {
                    key: "when",
                    header: t("columns.when"),
                    render: (row) => formatDate(row.event?.startTime ?? row.createdAt),
                  },
                ]}
              />
            )}
          </CmmsCard>
        ) : null}

        {tab === "contributions" ? (
          <CmmsCard title={t("tabs.contributions")}>
            {!caps.canViewContributions ? (
              <CmmsEmptyState
                title={t("contributionsRestricted")}
                description={t("contributionsRestrictedHint")}
              />
            ) : contributionsQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : (contributionsQuery.data?.items.length ?? 0) === 0 ? (
              <CmmsEmptyState title={t("noContributions")} description={t("noContributionsHint")} />
            ) : (
              <CmmsTable
                compact
                rows={contributionsQuery.data?.items ?? []}
                columns={[
                  {
                    key: "ref",
                    header: t("columns.reference"),
                    render: (row) => String(row.referenceNumber ?? "—"),
                  },
                  {
                    key: "type",
                    header: t("columns.type"),
                    render: (row) => {
                      const catalog = row.contributionTypeCatalog as { name?: string } | undefined;
                      return catalog?.name ?? "—";
                    },
                  },
                  {
                    key: "status",
                    header: t("columns.status"),
                    render: (row) => String(row.status ?? "—"),
                  },
                  {
                    key: "amount",
                    header: t("columns.amount"),
                    render: (row) => formatCurrency(Number(row.effectiveAmount ?? 0)),
                  },
                ]}
              />
            )}
          </CmmsCard>
        ) : null}

        {tab === "welfare" ? (
          <CmmsCard title={t("tabs.welfare")}>
            {!caps.canViewWelfare ? (
              <CmmsEmptyState
                title={t("welfareRestricted")}
                description={t("welfareRestrictedHint")}
              />
            ) : welfareQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : (welfareQuery.data?.items.length ?? 0) === 0 ? (
              <CmmsEmptyState title={t("noWelfare")} description={t("noWelfareHint")} />
            ) : (
              <CmmsTable
                compact
                rows={welfareQuery.data?.items ?? []}
                columns={[
                  {
                    key: "title",
                    header: t("columns.case"),
                    render: (row) => String(row.title ?? "—"),
                  },
                  {
                    key: "category",
                    header: t("columns.category"),
                    render: (row) => {
                      const category = row.category as { name?: string } | undefined;
                      return category?.name ?? "—";
                    },
                  },
                  {
                    key: "status",
                    header: t("columns.status"),
                    render: (row) => String(row.status ?? "—"),
                  },
                  {
                    key: "when",
                    header: t("columns.when"),
                    render: (row) => formatDate(String(row.updatedAt ?? "")),
                  },
                ]}
              />
            )}
          </CmmsCard>
        ) : null}

        {tab === "leadership" ? (
          <CmmsCard title={t("tabs.leadership")}>
            {data.leadership.familyRoles.length === 0 &&
            data.leadership.choirCommitteeRoles.length === 0 ? (
              <CmmsEmptyState title={t("noLeadership")} description={t("noLeadershipHint")} />
            ) : (
              <CmmsTable
                compact
                rows={[
                  ...data.leadership.familyRoles.map((row) => ({
                    id: `${row.familyId}-${row.role}`,
                    scope: row.familyName,
                    role: row.role,
                    since: row.since,
                  })),
                  ...data.leadership.choirCommitteeRoles.map((row, index) => ({
                    id: `committee-${index}`,
                    scope: t("choirCommittee"),
                    role: row.roleName,
                    since: row.assignedAt,
                  })),
                ]}
                columns={[
                  { key: "scope", header: t("columns.scope"), render: (row) => row.scope },
                  { key: "role", header: t("columns.role"), render: (row) => row.role },
                  {
                    key: "since",
                    header: t("columns.since"),
                    render: (row) => formatDate(row.since),
                  },
                ]}
              />
            )}
          </CmmsCard>
        ) : null}

        {tab === "discipline" ? (
          <CmmsCard title={t("tabs.discipline")}>
            {!caps.canViewDiscipline ? (
              <CmmsEmptyState
                title={t("disciplineRestricted")}
                description={t("disciplineRestrictedHint")}
              />
            ) : timelineQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : disciplineEvents.length === 0 ? (
              <CmmsEmptyState title={t("noDiscipline")} description={t("noDisciplineHint")} />
            ) : (
              <TimelineList events={disciplineEvents} t={t} />
            )}
          </CmmsCard>
        ) : null}

        {tab === "rehearsals" ? (
          <CmmsCard title={t("tabs.rehearsals")}>
            {timelineQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : rehearsalEvents.length === 0 ? (
              <CmmsEmptyState title={t("noRehearsals")} description={t("noRehearsalsHint")} />
            ) : (
              <TimelineList events={rehearsalEvents} t={t} />
            )}
          </CmmsCard>
        ) : null}

        {tab === "documents" ? (
          <CmmsCard title={t("tabs.documents")}>
            <CmmsEmptyState title={t("documentsComing")} description={t("documentsComingHint")} />
          </CmmsCard>
        ) : null}

        {tab === "timeline" ? (
          <CmmsCard title={t("tabs.timeline")}>
            {timelineQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
            ) : timelineQuery.data?.events.length ? (
              <TimelineList events={timelineQuery.data.events} t={t} />
            ) : (
              <CmmsEmptyState title={t("noTimeline")} description={t("noTimelineHint")} />
            )}
          </CmmsCard>
        ) : null}
      </div>
    </OperationalScreen>
  );
}

function TimelineList({
  events,
  t,
}: Readonly<{
  events: Array<{ type: string; timestamp: string; title: string; summary: string }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}>) {
  return (
    <ul className="divide-y divide-[var(--border)]">
      {events.map((event, index) => (
        <li key={`${event.type}-${event.timestamp}-${index}`} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-[var(--foreground)]">{event.title}</p>
            <CmmsBadge variant="neutral">{timelineTypeLabel(event.type, t)}</CmmsBadge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{event.summary}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {formatDate(event.timestamp)}
          </p>
        </li>
      ))}
    </ul>
  );
}
