"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsTable } from "@/components/ui/cmms-table";
import { http, getApiErrorMessage } from "@/core/api/http";
import { canManageRehearsals } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { Link } from "@/i18n/routing";

export function RehearsalsAttendancePage() {
  const t = useTranslations("rehearsals");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageRehearsals(profile?.permissions ?? []);
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("PRESENT");

  const eventsQuery = useQuery({
    queryKey: ["rehearsals", "attendance-events"],
    queryFn: async () => {
      const res = await http.get("/choir/rehearsals/attendance/events");
      return res.data.data as Array<{ id: string; title: string; startTime: string }>;
    },
  });

  const attendanceQuery = useQuery({
    queryKey: ["rehearsals", "attendance", eventId],
    queryFn: async () => {
      const res = await http.get(`/choir/rehearsals/plans/${eventId}/attendance`);
      return res.data.data as Array<{
        id: string;
        status: string;
        member: { id: string; firstName: string; lastName: string };
      }>;
    },
    enabled: Boolean(eventId),
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

  async function exportCsv() {
    const path = eventId
      ? `/choir/rehearsals/attendance/export.csv?eventId=${eventId}`
      : "/choir/rehearsals/attendance/export.csv";
    const res = await http.get(path, { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rehearsal-attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OperationalScreen title={t("attendanceTitle")} subtitle={t("attendanceSubtitle")}>
      <Link href="/dashboard/rehearsals" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToRehearsals")}
      </Link>
      <div className="mb-4 flex gap-2">
        <CmmsButton variant="secondary" onClick={() => void exportCsv()}>
          {t("exportCsv")}
        </CmmsButton>
      </div>
      <CmmsFormField label={t("selectRehearsal")} htmlFor="eventId">
        <select
          id="eventId"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">{t("selectRehearsal")}</option>
          {(eventsQuery.data ?? []).map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {new Date(ev.startTime).toLocaleDateString()}
            </option>
          ))}
        </select>
      </CmmsFormField>
      {canManage && eventId ? (
        <div className="my-4 flex flex-wrap items-end gap-3">
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
          <CmmsButton
            disabled={!memberId || recordMutation.isPending}
            onClick={() => recordMutation.mutate()}
          >
            {t("markAttendance")}
          </CmmsButton>
          {recordMutation.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(recordMutation.error)}
            </p>
          ) : null}
        </div>
      ) : null}
      {attendanceQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
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
    </OperationalScreen>
  );
}
