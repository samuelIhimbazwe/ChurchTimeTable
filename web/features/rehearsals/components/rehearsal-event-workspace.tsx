"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchRehearsalDashboard,
  fetchRehearsalPlan,
  getApiErrorMessage,
  http,
} from "@/core/api/http";
import { canManageRehearsals } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { RehearsalPlanPanel } from "@/features/rehearsals/components/rehearsal-plan-panel";

export function RehearsalEventWorkspace({
  open,
  onClose,
  eventId,
  eventTitle,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}>) {
  const t = useTranslations("rehearsals");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageRehearsals(profile?.permissions ?? []);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("plan");
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("PRESENT");

  const planQuery = useQuery({
    queryKey: ["rehearsals", "plan", eventId],
    queryFn: () => fetchRehearsalPlan(eventId),
    enabled: open,
  });

  const attendanceQuery = useQuery({
    queryKey: ["rehearsals", "attendance", eventId],
    queryFn: async () => {
      const res = await http.get(`/choir/rehearsals/plans/${eventId}/attendance`);
      return res.data.data as Array<{
        id: string;
        status: string;
        member: { firstName: string; lastName: string };
      }>;
    },
    enabled: open && tab === "attendance",
  });

  const readinessQuery = useQuery({
    queryKey: ["rehearsals", "readiness"],
    queryFn: async () => {
      const res = await http.get("/choir/rehearsals/readiness");
      return res.data.data as Array<{
        name: string;
        readiness: number;
        unresolvedIssues: number;
      }>;
    },
    enabled: open && tab === "readiness",
  });

  const dashboardQuery = useQuery({
    queryKey: ["rehearsals", "dashboard"],
    queryFn: fetchRehearsalDashboard,
    enabled: open,
  });

  const recordMutation = useMutation({
    mutationFn: async () => {
      await http.post(`/choir/rehearsals/plans/${eventId}/attendance`, {
        entries: [{ memberId, status }],
      });
    },
    onSuccess: async () => {
      setMemberId("");
      await queryClient.invalidateQueries({ queryKey: ["rehearsals", "attendance", eventId] });
    },
  });

  const plan = planQuery.data as Record<string, unknown> | undefined;
  const readiness = (plan?.readiness as { overall?: number })?.overall ?? 0;
  const upcoming = dashboardQuery.data?.upcomingRehearsals?.find((e) => e.id === eventId);

  const tabs = [
    { id: "plan", label: t("planTitle") },
    { id: "attendance", label: t("attendanceNav") },
    { id: "readiness", label: t("readinessNav") },
    { id: "history", label: t("attendanceHistory") },
  ];

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={eventTitle}
      className="max-w-4xl"
      bodyClassName="max-h-[75vh] overflow-y-auto"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <DashboardStateCard label={t("readinessLabel")} value={`${readiness}%`} />
        <DashboardStateCard
          label={t("servicePrepScore")}
          value={`${upcoming?.readiness?.overall ?? readiness}%`}
        />
        <DashboardStateCard
          label={t("attendanceRate")}
          value={`${dashboardQuery.data?.attendanceRate ?? 0}%`}
        />
      </div>
      <CmmsTabs items={tabs} activeId={tab} onChange={setTab} />
      {tab === "plan" ? (
        <div className="mt-4">
          <RehearsalPlanPanel eventId={eventId} />
        </div>
      ) : null}
      {tab === "attendance" ? (
        <div className="mt-4">
          {canManage ? (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <CmmsFormField label={t("memberId")} htmlFor="memberId">
                <CmmsInput id="memberId" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
              </CmmsFormField>
              <CmmsFormField label={t("status")} htmlFor="status">
                <select
                  id="status"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="EXCUSED">EXCUSED</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </CmmsFormField>
              <CmmsButton disabled={!memberId || recordMutation.isPending} onClick={() => recordMutation.mutate()}>
                {t("markAttendance")}
              </CmmsButton>
              {recordMutation.isError ? (
                <p className="text-sm text-destructive">{getApiErrorMessage(recordMutation.error)}</p>
              ) : null}
            </div>
          ) : null}
          <CmmsTable
            rows={attendanceQuery.data ?? []}
            columns={[
              {
                key: "member",
                header: t("member"),
                render: (r) => `${r.member.firstName} ${r.member.lastName}`,
              },
              { key: "status", header: t("status"), render: (r) => r.status },
            ]}
          />
        </div>
      ) : null}
      {tab === "readiness" ? (
        <div className="mt-4">
          <CmmsTable
            rows={readinessQuery.data ?? []}
            columns={[
              { key: "name", header: t("section"), render: (r) => r.name },
              { key: "readiness", header: t("readinessLabel"), render: (r) => `${r.readiness}%` },
              { key: "issues", header: t("unresolvedIssues"), render: (r) => r.unresolvedIssues },
            ]}
          />
        </div>
      ) : null}
      {tab === "history" ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{t("attendanceHistoryHint")}</p>
          <CmmsTable
            rows={attendanceQuery.data ?? []}
            columns={[
              {
                key: "member",
                header: t("member"),
                render: (r) => `${r.member.firstName} ${r.member.lastName}`,
              },
              { key: "status", header: t("status"), render: (r) => r.status },
            ]}
          />
        </div>
      ) : null}
    </CmmsModal>
  );
}
