"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsPageSection } from "@/components/ui/cmms-page-section";
import { CmmsSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { getApiErrorMessage } from "@/core/api/errors";
import { createDisciplineCase } from "@/core/api/http";
import type {
  AttendanceOperationalStatus,
  AttendanceRecordItem,
  AttendanceUpsertInput,
} from "@/core/api/types";
import { useSessionStore } from "@/core/auth/session-store";
import {
  canMarkAttendance,
  canViewProtocolWideRoster,
  hasChoirOperations,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHead,
  isChoirOnlyOperations,
} from "@/core/auth/governance-permissions";
import {
  useApproveExcusedMutation,
  useAttendanceAnalyticsQuery,
  useBulkAttendanceMutation,
  useChoirAttendanceQuery,
  useCoordinatorAttendanceQuery,
  useDisciplineRecommendationsQuery,
  useEscalateAttendanceMutation,
  useEventAttendanceQuery,
  useEventRosterQuery,
  useMemberAttendanceHistoryQuery,
  useMemberAttendanceScoreQuery,
  usePresidentAttendanceQuery,
  useTeamHeadAttendanceQuery,
  useUpcomingEventsQuery,
  useUpsertAttendanceMutation,
} from "@/features/attendance/hooks/use-attendance-engine";
import {
  AttendanceMarkDialog,
  type MarkDialogMode,
} from "@/features/attendance/components/attendance-mark-dialog";
import {
  AttendanceEscalationDialog,
  AttendanceExcuseReviewDialog,
} from "@/features/attendance/components/attendance-review-dialogs";

type OperationalTab = "marking" | "teamHead" | "coordinator" | "president" | "choir";
type MarkingFlowTab = "today" | "excused" | "history";

const operationalStatuses: AttendanceOperationalStatus[] = [
  "ATTENDED",
  "LATE",
  "EXCUSED_ABSENCE",
  "UNEXCUSED_ABSENCE",
  "REPLACEMENT_SERVED",
  "VOLUNTARY_EXTRA_SERVICE",
];

function scoreBandVariant(tone: string): "success" | "info" | "danger" | "neutral" {
  if (tone === "success") return "success";
  if (tone === "info") return "info";
  if (tone === "danger") return "danger";
  return "neutral";
}

export function AttendanceEngine() {
  const t = useTranslations("attendance");
  const profile = useSessionStore((state) => state.profile);
  const perms = profile?.permissions ?? [];
  const canWrite = canMarkAttendance(perms);
  const canTeamHead = hasProtocolTeamHead(perms);
  const canCoordinator = hasProtocolCoordination(perms);
  const canPresident = hasProtocolOversight(perms);
  const canChoirTab = hasChoirOperations(perms);
  const canDiscipline = profile?.permissions.includes("discipline:manage") ?? false;
  const canFullRoster = canViewProtocolWideRoster(perms);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [tab, setTab] = useState<OperationalTab>("marking");
  const [markingFlow, setMarkingFlow] = useState<MarkingFlowTab>("today");
  const [error, setError] = useState<string | null>(null);
  const [markDialog, setMarkDialog] = useState<{
    memberId: string;
    memberName: string;
    mode: MarkDialogMode;
  } | null>(null);
  const [excuseReview, setExcuseReview] = useState<{
    id: string;
    memberName: string;
    excuseReason?: string | null;
    mode: "approve" | "reject";
  } | null>(null);
  const [escalationTarget, setEscalationTarget] = useState<{
    id: string;
    memberName: string;
  } | null>(null);

  const eventsQuery = useUpcomingEventsQuery();
  const rosterQuery = useEventRosterQuery(selectedEventId);
  const attendanceQuery = useEventAttendanceQuery(selectedEventId);
  const scoreQuery = useMemberAttendanceScoreQuery(selectedMemberId);
  const historyQuery = useMemberAttendanceHistoryQuery(selectedMemberId);
  const analyticsQuery = useAttendanceAnalyticsQuery(canPresident || canCoordinator);
  const teamHeadQuery = useTeamHeadAttendanceQuery(canTeamHead && tab === "teamHead");
  const teamHeadScopeQuery = useTeamHeadAttendanceQuery(canTeamHead && !canFullRoster);
  const coordinatorQuery = useCoordinatorAttendanceQuery(canCoordinator && tab === "coordinator");
  const presidentQuery = usePresidentAttendanceQuery(canPresident && tab === "president");
  const choirQuery = useChoirAttendanceQuery(canChoirTab && tab === "choir");
  const disciplineQuery = useDisciplineRecommendationsQuery(canPresident && tab === "president");

  const upsertMutation = useUpsertAttendanceMutation(selectedEventId);
  const bulkMutation = useBulkAttendanceMutation(selectedEventId);
  const approveMutation = useApproveExcusedMutation(selectedEventId);
  const escalateMutation = useEscalateAttendanceMutation(selectedEventId);
  const disciplineMutation = useMutation({
    mutationFn: createDisciplineCase,
  });

  const allEvents = eventsQuery.data?.items ?? [];
  const markingEvents = useMemo(() => {
    if (canPresident || canCoordinator) return allEvents;
    if (isChoirOnlyOperations(perms)) {
      return allEvents.filter(
        (event) =>
          event.ministryScope === "CHOIR" || event.ministryScope === "BOTH",
      );
    }
    if (hasProtocolTeamHead(perms) && !canFullRoster) {
      return allEvents.filter(
        (event) =>
          event.ministryScope === "PROTOCOL" || event.ministryScope === "BOTH",
      );
    }
    return allEvents;
  }, [allEvents, canCoordinator, canFullRoster, canPresident, perms]);
  const roster = rosterQuery.data?.items ?? [];
  const visibleRoster = useMemo(() => {
    if (canFullRoster) return roster;
    const scopedIds = teamHeadScopeQuery.data?.scopedMemberIds;
    if (hasProtocolTeamHead(perms) && scopedIds?.length) {
      const allowed = new Set(scopedIds);
      return roster.filter((assignment) => allowed.has(assignment.memberId));
    }
    return roster;
  }, [canFullRoster, perms, roster, teamHeadScopeQuery.data?.scopedMemberIds]);
  const records = attendanceQuery.data?.items ?? [];

  const recordByMember = useMemo(() => {
    const map = new Map<string, AttendanceRecordItem>();
    for (const row of records) {
      map.set(row.memberId, row);
    }
    return map;
  }, [records]);

  const pendingExcuses = useMemo(
    () =>
      records.filter(
        (row) =>
          row.operationalStatus === "EXCUSED_ABSENCE" && !row.approvedById,
      ),
    [records],
  );

  async function submitMark(
    memberId: string,
    partial: Partial<AttendanceUpsertInput>,
  ) {
    if (!selectedEventId) return;
    setError(null);
    const input: AttendanceUpsertInput = {
      eventId: selectedEventId,
      memberId,
      physicalStatus: partial.physicalStatus ?? "PRESENT",
      ...partial,
    };
    try {
      await upsertMutation.mutateAsync(input);
    } catch (markError) {
      setError(getApiErrorMessage(markError, t("markFailed")));
    }
  }

  async function markMember(
    memberId: string,
    physicalStatus: "PRESENT" | "ABSENT" | "LATE",
    operationalStatus?: AttendanceOperationalStatus,
  ) {
    await submitMark(memberId, { physicalStatus, operationalStatus });
  }

  async function markAllPresent() {
    if (!selectedEventId || !visibleRoster.length) return;
    setError(null);
    const recordsToSend: AttendanceUpsertInput[] = visibleRoster.map((assignment) => ({
      eventId: selectedEventId,
      memberId: assignment.memberId,
      physicalStatus: "PRESENT",
      operationalStatus: "ATTENDED",
    }));
    try {
      await bulkMutation.mutateAsync(recordsToSend);
    } catch (bulkError) {
      setError(getApiErrorMessage(bulkError, t("bulkFailed")));
    }
  }

  const tabs: Array<{ id: OperationalTab; label: string; visible: boolean }> = [
    { id: "marking", label: t("tabs.marking"), visible: canWrite },
    { id: "teamHead", label: t("tabs.teamHead"), visible: canTeamHead },
    { id: "coordinator", label: t("tabs.coordinator"), visible: canCoordinator },
    { id: "president", label: t("tabs.president"), visible: canPresident },
    { id: "choir", label: t("tabs.choir"), visible: canChoirTab },
  ];

  const visibleTabs = tabs
    .filter((item) => item.visible)
    .map((item) => ({ id: item.id, label: item.label }));

  return (
    <OperationalScreen
      title={t("title")}
      subtitle={t("subtitle")}
      tabs={visibleTabs}
      activeTabId={tab}
      onTabChange={(id) => setTab(id as OperationalTab)}
      error={error}
    >
      {tab === "marking" ? (
        <CmmsPageSection
          title={t("markingFlow.sectionTitle")}
          description={t("markingFlow.sectionHint")}
          action={
            <CmmsTabs
              items={[
                { id: "today", label: t("markingFlow.today") },
                { id: "excused", label: t("markingFlow.excused") },
                { id: "history", label: t("markingFlow.history") },
              ]}
              activeId={markingFlow}
              onChange={(id) => setMarkingFlow(id as MarkingFlowTab)}
            />
          }
        >
        {markingFlow === "excused" ? (
          pendingExcuses.length > 0 && canWrite ? (
            <CmmsCard title={t("excuseReview.title")} description={t("excuseReview.subtitle")}>
              <ul className="space-y-3">
                {pendingExcuses.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-[var(--border)] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {row.member?.firstName} {row.member?.lastName}
                      </p>
                      <p className="cmms-text-caption text-[var(--muted-foreground)]">
                        {row.excuseReason ?? t("excuseReview.noReason")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CmmsButton
                        size="sm"
                        variant="primary"
                        disabled={approveMutation.isPending}
                        onClick={() =>
                          setExcuseReview({
                            id: row.id,
                            memberName: `${row.member?.firstName ?? ""} ${row.member?.lastName ?? ""}`.trim(),
                            excuseReason: row.excuseReason,
                            mode: "approve",
                          })
                        }
                      >
                        {t("excuseReview.approve")}
                      </CmmsButton>
                      <CmmsButton
                        size="sm"
                        variant="secondary"
                        disabled={approveMutation.isPending}
                        onClick={() =>
                          setExcuseReview({
                            id: row.id,
                            memberName: `${row.member?.firstName ?? ""} ${row.member?.lastName ?? ""}`.trim(),
                            excuseReason: row.excuseReason,
                            mode: "reject",
                          })
                        }
                      >
                        {t("excuseReview.reject")}
                      </CmmsButton>
                      <CmmsButton
                        size="sm"
                        variant="secondary"
                        disabled={escalateMutation.isPending}
                        onClick={() =>
                          setEscalationTarget({
                            id: row.id,
                            memberName: `${row.member?.firstName ?? ""} ${row.member?.lastName ?? ""}`.trim(),
                          })
                        }
                      >
                        {t("excuseReview.escalate")}
                      </CmmsButton>
                    </div>
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : (
            <CmmsEmptyState
              title={t("markingFlow.noExcusedTitle")}
              description={t("markingFlow.noExcusedDescription")}
            />
          )
        ) : markingFlow === "history" ? (
          selectedMemberId && historyQuery.data ? (
            <CmmsCard title={t("memberHistory.title")} description={t("memberHistory.subtitle")}>
              <CmmsTable
                rows={historyQuery.data.records.slice(0, 20)}
                emptyState={t("memberHistory.empty")}
                columns={[
                  {
                    key: "event",
                    header: t("table.event"),
                    render: (row) => row.event?.title ?? "—",
                  },
                  {
                    key: "status",
                    header: t("table.status"),
                    render: (row) =>
                      row.operationalStatus ? (
                        <CmmsBadge variant="neutral">
                          {t(`status.${row.operationalStatus}`)}
                        </CmmsBadge>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "when",
                    header: t("table.when"),
                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                  },
                ]}
              />
            </CmmsCard>
          ) : (
            <CmmsEmptyState
              title={t("markingFlow.noHistoryTitle")}
              description={t("markingFlow.noHistoryDescription")}
            />
          )
        ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <CmmsCard title={t("eventPicker.title")} description={t("eventPicker.subtitle")}>
            {eventsQuery.isLoading ? (
              <CmmsSkeleton className="h-40" />
            ) : markingEvents.length === 0 ? (
              <CmmsEmptyState
                title={t("eventPicker.emptyTitle")}
                description={t("eventPicker.empty")}
              />
            ) : (
              <ul className="space-y-2">
                {markingEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedEventId === event.id
                          ? "border-[var(--accent)] bg-[var(--surface-muted)]"
                          : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                      }`}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setSelectedMemberId(null);
                      }}
                    >
                      <span className="font-medium">{event.title}</span>
                      <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                        {new Date(event.startTime).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CmmsCard>

          <CmmsCard
            title={t("roster.title")}
            description={
              selectedEventId
                ? t("roster.subtitleActive", { count: visibleRoster.length })
                : t("roster.subtitleIdle")
            }
          >
            {!selectedEventId ? (
              <CmmsEmptyState
                title={t("roster.selectEventTitle")}
                description={t("roster.selectEvent")}
              />
            ) : rosterQuery.isLoading || attendanceQuery.isLoading ? (
              <CmmsSkeleton className="h-48" />
            ) : (
              <>
                {canWrite ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <CmmsButton
                      variant="primary"
                      disabled={bulkMutation.isPending || !visibleRoster.length}
                      onClick={() => void markAllPresent()}
                    >
                      {t("actions.markAllPresent")}
                    </CmmsButton>
                  </div>
                ) : null}

                <CmmsTable
                  rows={visibleRoster}
                  emptyState={t("roster.empty")}
                  columns={[
                    {
                      key: "member",
                      header: t("table.member"),
                      render: (assignment) => (
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => setSelectedMemberId(assignment.memberId)}
                        >
                          {assignment.member.firstName} {assignment.member.lastName}
                        </button>
                      ),
                    },
                    {
                      key: "status",
                      header: t("table.status"),
                      render: (assignment) => {
                        const record = recordByMember.get(assignment.memberId);
                        return record?.operationalStatus ? (
                          <CmmsBadge variant="neutral">
                            {t(`status.${record.operationalStatus}`)}
                          </CmmsBadge>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">{t("table.notMarked")}</span>
                        );
                      },
                    },
                    {
                      key: "score",
                      header: t("table.score"),
                      render: (assignment) =>
                        selectedMemberId === assignment.memberId && scoreQuery.data ? (
                          <CmmsBadge variant={scoreBandVariant(scoreQuery.data.tone)}>
                            {scoreQuery.data.percentage}% · {scoreQuery.data.bandLabel}
                          </CmmsBadge>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        ),
                    },
                    ...(canWrite
                      ? [
                          {
                            key: "actions",
                            header: t("table.actions"),
                            render: (assignment: (typeof visibleRoster)[number]) => (
                              <div className="flex flex-wrap gap-1">
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    void markMember(
                                      assignment.memberId,
                                      "PRESENT",
                                      "ATTENDED",
                                    )
                                  }
                                >
                                  {t("actions.present")}
                                </CmmsButton>
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    setMarkDialog({
                                      memberId: assignment.memberId,
                                      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
                                      mode: "late",
                                    })
                                  }
                                >
                                  {t("actions.late")}
                                </CmmsButton>
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    setMarkDialog({
                                      memberId: assignment.memberId,
                                      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
                                      mode: "excused",
                                    })
                                  }
                                >
                                  {t("actions.excused")}
                                </CmmsButton>
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    setMarkDialog({
                                      memberId: assignment.memberId,
                                      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
                                      mode: "unexcused",
                                    })
                                  }
                                >
                                  {t("actions.unexcused")}
                                </CmmsButton>
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    setMarkDialog({
                                      memberId: assignment.memberId,
                                      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
                                      mode: "replacement",
                                    })
                                  }
                                >
                                  {t("actions.replacement")}
                                </CmmsButton>
                                <CmmsButton
                                  size="sm"
                                  variant="secondary"
                                  disabled={upsertMutation.isPending}
                                  onClick={() =>
                                    setMarkDialog({
                                      memberId: assignment.memberId,
                                      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
                                      mode: "voluntary",
                                    })
                                  }
                                >
                                  {t("actions.voluntary")}
                                </CmmsButton>
                              </div>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </>
            )}
          </CmmsCard>

          {(canPresident || canCoordinator) && analyticsQuery.data ? (
            <CmmsCard
              className="lg:col-span-2"
              title={t("analytics.title")}
              description={t("analytics.subtitle")}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label={t("analytics.total")} value={analyticsQuery.data.total} />
                <Stat
                  label={t("analytics.excusedRatio")}
                  value={`${analyticsQuery.data.excusedRatio}%`}
                />
                <Stat
                  label={t("analytics.voluntary")}
                  value={analyticsQuery.data.voluntaryExtra}
                />
                <Stat
                  label={t("analytics.replacements")}
                  value={analyticsQuery.data.replacementServed}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {operationalStatuses.map((status) => (
                  <CmmsBadge key={status} variant="neutral">
                    {t(`status.${status}`)}:{" "}
                    {analyticsQuery.data?.statusCounts[status] ?? 0}
                  </CmmsBadge>
                ))}
              </div>
            </CmmsCard>
          ) : null}
        </div>
        )}
        </CmmsPageSection>
      ) : null}

      {tab === "teamHead" && teamHeadQuery.data ? (
        <div className="space-y-4">
          <OperationalPanel
            title={t("teamHead.title")}
            escalations={teamHeadQuery.data.escalations}
            pending={teamHeadQuery.data.pendingAbsences}
            emptyTitle={t("teamHead.empty")}
            emptyDescription={t("teamHead.emptyDescription")}
            t={t}
          />
          {teamHeadQuery.data.teams?.length ? (
            <CmmsCard title={t("teamHead.teamsTitle")}>
              <ul className="space-y-2">
                {teamHeadQuery.data.teams.map((team) => (
                  <li
                    key={team.id}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    {team.serviceType} · {team.month}/{team.year} ·{" "}
                    {t("teamHead.memberCount", { count: team.memberCount })}
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : (
            <CmmsEmptyState
              title={t("teamHead.noTeamsTitle")}
              description={t("teamHead.noTeamsDescription")}
            />
          )}
        </div>
      ) : null}

      {tab === "coordinator" && coordinatorQuery.data ? (
        <div className="space-y-4">
          <OperationalPanel
            title={t("coordinator.title")}
            escalations={coordinatorQuery.data.escalated}
            pending={coordinatorQuery.data.absentMembers}
            emptyTitle={t("coordinator.empty")}
            emptyDescription={t("coordinator.emptyDescription")}
            extra={
              <>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("coordinator.readiness", {
                    count: coordinatorQuery.data.readinessWarnings,
                  })}
                </p>
                {coordinatorQuery.data.overloadAlerts?.length ? (
                  <div className="mt-3">
                    <h3 className="mb-2 text-sm font-semibold">{t("coordinator.overload")}</h3>
                    <ul className="space-y-1 text-sm text-[var(--muted-foreground)]">
                      {coordinatorQuery.data.overloadAlerts.map((alert) => (
                        <li key={alert.memberId}>
                          {alert.memberId.slice(0, 8)}… · {alert.assignmentCount}{" "}
                          {t("coordinator.assignments")}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            }
            t={t}
          />
        </div>
      ) : null}

      {tab === "president" && presidentQuery.data ? (
        <div className="space-y-4">
          <OperationalPanel
            title={t("president.title")}
            escalations={presidentQuery.data.escalated}
            pending={presidentQuery.data.absentMembers}
            emptyTitle={t("president.empty")}
            emptyDescription={t("president.emptyDescription")}
            extra={
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label={t("president.disciplineRisk")}
                  value={presidentQuery.data.disciplineRiskCount}
                />
                <Stat
                  label={t("president.voluntary")}
                  value={presidentQuery.data.voluntaryContributions}
                />
                <Stat
                  label={t("president.pendingReplacements")}
                  value={presidentQuery.data.pendingReplacements}
                />
              </div>
            }
            t={t}
          />
          {presidentQuery.data.attendanceTrend?.length ? (
            <CmmsCard title={t("president.trendTitle")}>
              <ul className="space-y-2">
                {presidentQuery.data.attendanceTrend.map((point) => (
                  <li
                    key={point.label}
                    className="flex justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span>{point.label}</span>
                    <span>
                      {t("president.trendPresent", { count: point.present })} ·{" "}
                      {t("president.trendAbsent", { count: point.absent })}
                    </span>
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : (
            <CmmsEmptyState
              title={t("president.noTrendTitle")}
              description={t("president.noTrendDescription")}
            />
          )}
          {disciplineQuery.data?.items.length ? (
            <CmmsCard
              title={t("discipline.title")}
              description={t("discipline.subtitle")}
            >
              <ul className="space-y-2">
                {disciplineQuery.data.items.map((item) => (
                  <li
                    key={item.memberId}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.recommendation}</p>
                    {canDiscipline ? (
                      <CmmsButton
                        variant="secondary"
                        className="mt-2"
                        disabled={disciplineMutation.isPending}
                        onClick={async () => {
                          setError(null);
                          try {
                            await disciplineMutation.mutateAsync({
                              memberId: item.memberId,
                              ministry: "BOTH",
                              title: `Attendance review — ${item.firstName} ${item.lastName}`,
                              description: item.recommendation,
                            });
                          } catch (disciplineError) {
                            setError(
                              getApiErrorMessage(disciplineError, t("disciplineCreateFailed")),
                            );
                          }
                        }}
                      >
                        {t("discipline.createCase")}
                      </CmmsButton>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CmmsCard>
          ) : disciplineQuery.isSuccess ? (
            <CmmsEmptyState
              title={t("discipline.emptyTitle")}
              description={t("discipline.emptyDescription")}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "choir" && choirQuery.data ? (
        <CmmsCard title={t("choir.title")} description={t("choir.subtitle")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label={t("choir.totalMarked")} value={choirQuery.data.totalMarked} />
            <Stat label={t("choir.excused")} value={choirQuery.data.excused} />
            <Stat label={t("choir.unexcused")} value={choirQuery.data.unexcused} />
            <Stat label={t("choir.lateness")} value={choirQuery.data.repeatedLateness} />
            <Stat
              label={t("choir.pendingReview")}
              value={choirQuery.data.pendingExcuseReview}
            />
          </div>
        </CmmsCard>
      ) : null}

      <AttendanceMarkDialog
        open={Boolean(markDialog)}
        mode={markDialog?.mode ?? null}
        memberName={markDialog?.memberName ?? ""}
        onClose={() => setMarkDialog(null)}
        onSubmit={async (partial) => {
          if (!markDialog) return;
          await submitMark(markDialog.memberId, partial);
        }}
      />

      <AttendanceExcuseReviewDialog
        open={Boolean(excuseReview)}
        mode={excuseReview?.mode ?? null}
        memberName={excuseReview?.memberName ?? ""}
        excuseReason={excuseReview?.excuseReason}
        onClose={() => setExcuseReview(null)}
        onSubmit={async ({ approve }) => {
          if (!excuseReview) return;
          setError(null);
          try {
            await approveMutation.mutateAsync({ id: excuseReview.id, approve });
          } catch (reviewError) {
            setError(getApiErrorMessage(reviewError, t("markFailed")));
            throw reviewError;
          }
        }}
      />

      <AttendanceEscalationDialog
        open={Boolean(escalationTarget)}
        memberName={escalationTarget?.memberName ?? ""}
        onClose={() => setEscalationTarget(null)}
        onSubmit={async ({ level, notes }) => {
          if (!escalationTarget) return;
          setError(null);
          try {
            await escalateMutation.mutateAsync({
              id: escalationTarget.id,
              level,
              notes,
            });
          } catch (escalateError) {
            setError(getApiErrorMessage(escalateError, t("markFailed")));
            throw escalateError;
          }
        }}
      />
    </OperationalScreen>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function OperationalPanel({
  title,
  escalations,
  pending,
  emptyTitle,
  emptyDescription,
  extra,
  t,
}: {
  title: string;
  escalations: AttendanceRecordItem[];
  pending: AttendanceRecordItem[];
  emptyTitle: string;
  emptyDescription: string;
  extra?: React.ReactNode;
  t: ReturnType<typeof useTranslations<"attendance">>;
}) {
  const hasItems = escalations.length > 0 || pending.length > 0;
  return (
    <div className="space-y-4">
      <CmmsCard title={title}>
        {extra}
        {!hasItems ? (
          <CmmsEmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("panels.escalations")}</h3>
              <RecordList items={escalations} emptyTitle={t("panels.none")} t={t} />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("panels.pendingAbsences")}</h3>
              <RecordList items={pending} emptyTitle={t("panels.none")} t={t} />
            </section>
          </div>
        )}
      </CmmsCard>
    </div>
  );
}

function RecordList({
  items,
  emptyTitle,
  t,
}: {
  items: AttendanceRecordItem[];
  emptyTitle: string;
  t: ReturnType<typeof useTranslations<"attendance">>;
}) {
  if (!items.length) {
    return <CmmsEmptyState title={emptyTitle} className="py-6" />;
  }
  return (
    <ul className="space-y-2">
      {items.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <p className="font-medium">
            {row.member?.firstName} {row.member?.lastName}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {row.operationalStatus ? t(`status.${row.operationalStatus}`) : "—"}
            {row.escalated ? ` · ${t("panels.escalated")}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
