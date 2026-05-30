"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { getApiErrorMessage } from "@/core/api/errors";
import { submitSelfExcusedAbsence } from "@/core/api/http";
import type { MemberDashboardSummary } from "@/core/api/types";
import { formatDateTime } from "@/features/dashboard/components/dashboard-primitives";

const EXCUSE_REASONS = [
  "illness",
  "travel",
  "work_school",
  "emergency",
  "family_issue",
  "approved_leave",
  "unavoidable_conflict",
  "unknown",
] as const;

export function MemberExcusePanel({
  assignments,
}: {
  assignments: MemberDashboardSummary["upcomingSchedule"];
}) {
  const t = useTranslations("dashboard");
  const ta = useTranslations("attendance");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<(typeof assignments)[number] | null>(null);
  const [reasonType, setReasonType] = useState("illness");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: submitSelfExcusedAbsence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "member"] });
      setSelected(null);
      setNotes("");
      setError(null);
    },
    onError: (submitError) => {
      setError(getApiErrorMessage(submitError, t("memberExcuseFailed")));
    },
  });

  if (!assignments.length) {
    return null;
  }

  return (
    <>
      <CmmsCard
        title={t("memberExcuseTitle")}
        description={t("memberExcuseDescription")}
      >
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--foreground)] break-words">
                  {assignment.event.title}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {formatDateTime(assignment.event.startTime)}
                </p>
              </div>
              <CmmsButton variant="secondary" onClick={() => setSelected(assignment)}>
                {t("memberExcuseAction")}
              </CmmsButton>
            </div>
          ))}
        </div>
      </CmmsCard>

      <CmmsModal
        open={Boolean(selected)}
        title={t("memberExcuseModalTitle", {
          event: selected?.event.title ?? "",
        })}
        closeLabel={ta("markDialog.cancel")}
        onClose={() => {
          setSelected(null);
          setError(null);
        }}
      >
        <div className="cmms-section-stack">
          {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
          <CmmsFormField label={ta("markDialog.reasonType")}>
            <CmmsSelect
              value={reasonType}
              onChange={(event) => setReasonType(event.target.value)}
            >
              {EXCUSE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {ta(`excuseReasons.${reason}`)}
                </option>
              ))}
            </CmmsSelect>
          </CmmsFormField>
          <CmmsFormField label={ta("markDialog.notes")}>
            <CmmsInput
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </CmmsFormField>
          <div className="flex justify-end gap-2 pt-2">
            <CmmsButton variant="secondary" onClick={() => setSelected(null)}>
              {ta("markDialog.cancel")}
            </CmmsButton>
            <CmmsButton
              disabled={mutation.isPending || !selected}
              onClick={() => {
                if (!selected) return;
                mutation.mutate({
                  eventId: selected.event.id,
                  reasonType,
                  excuseReason: notes || reasonType,
                  notes: notes || undefined,
                });
              }}
            >
              {mutation.isPending ? t("memberExcuseSubmitting") : t("memberExcuseSubmit")}
            </CmmsButton>
          </div>
        </div>
      </CmmsModal>
    </>
  );
}
