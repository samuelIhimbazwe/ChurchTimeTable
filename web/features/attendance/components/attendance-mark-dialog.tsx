"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsSelect } from "@/components/ui/cmms-select";
import type {
  AttendanceOperationalStatus,
  AttendanceReplacementType,
  AttendanceUpsertInput,
} from "@/core/api/types";

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

export type MarkDialogMode =
  | "excused"
  | "unexcused"
  | "late"
  | "replacement"
  | "voluntary";

export function AttendanceMarkDialog({
  open,
  mode,
  memberName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: MarkDialogMode | null;
  memberName: string;
  onClose: () => void;
  onSubmit: (input: Partial<AttendanceUpsertInput>) => Promise<void>;
}) {
  const t = useTranslations("attendance");
  const [reasonType, setReasonType] = useState("illness");
  const [excuseReason, setExcuseReason] = useState("");
  const [lateMinutes, setLateMinutes] = useState("15");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!mode) return null;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (mode === "excused") {
        await onSubmit({
          physicalStatus: "ABSENT",
          operationalStatus: "EXCUSED_ABSENCE",
          reasonCategory: "EXCUSED",
          excuseReason: excuseReason || reasonType,
          reasonType,
          excuseEvidenceUrl: evidenceUrl || undefined,
        });
      } else if (mode === "unexcused") {
        await onSubmit({
          physicalStatus: "ABSENT",
          operationalStatus: "UNEXCUSED_ABSENCE",
          reasonCategory: "UNEXCUSED",
          excuseReason: excuseReason || undefined,
        });
      } else if (mode === "late") {
        await onSubmit({
          physicalStatus: "LATE",
          operationalStatus: "LATE",
          lateMinutes: Number(lateMinutes) || undefined,
        });
      } else if (mode === "replacement") {
        await onSubmit({
          physicalStatus: "PRESENT",
          operationalStatus: "REPLACEMENT_SERVED",
          replacementType: "LEADER_ASSIGNED",
          countsAsOfficial: true,
          voluntaryExtra: false,
        });
      } else if (mode === "voluntary") {
        await onSubmit({
          physicalStatus: "PRESENT",
          operationalStatus: "VOLUNTARY_EXTRA_SERVICE",
          replacementType: "VOLUNTARY",
          countsAsOfficial: false,
          voluntaryExtra: true,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={t(`markDialog.${mode}Title`, { member: memberName })}
      closeLabel={t("markDialog.cancel")}
      footer={
        <div className="flex justify-end gap-2">
          <CmmsButton variant="secondary" onClick={onClose} disabled={submitting}>
            {t("markDialog.cancel")}
          </CmmsButton>
          <CmmsButton variant="primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t("markDialog.saving") : t("markDialog.save")}
          </CmmsButton>
        </div>
      }
    >
      <div className="cmms-section-stack">
        {(mode === "excused" || mode === "unexcused") && (
          <>
            {mode === "excused" ? (
              <CmmsFormField label={t("markDialog.reasonType")}>
                <CmmsSelect
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value)}
                >
                  {EXCUSE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {t(`excuseReasons.${reason}`)}
                    </option>
                  ))}
                </CmmsSelect>
              </CmmsFormField>
            ) : null}
            <CmmsFormField label={t("markDialog.notes")}>
              <CmmsInput
                value={excuseReason}
                onChange={(e) => setExcuseReason(e.target.value)}
              />
            </CmmsFormField>
            {mode === "excused" ? (
              <CmmsFormField
                label={t("markDialog.evidenceUrl")}
                hint={t("markDialog.evidenceHint")}
              >
                <CmmsInput
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </CmmsFormField>
            ) : null}
          </>
        )}
        {mode === "late" ? (
          <CmmsFormField label={t("markDialog.lateMinutes")}>
            <CmmsInput
              type="number"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(e.target.value)}
            />
          </CmmsFormField>
        ) : null}
        {(mode === "replacement" || mode === "voluntary") ? (
          <p className="cmms-text-body text-[var(--muted-foreground)]">
            {t(`markDialog.${mode}Confirm`)}
          </p>
        ) : null}
      </div>
    </CmmsModal>
  );
}

export function operationalStatusFromMode(mode: MarkDialogMode): AttendanceOperationalStatus {
  const map: Record<MarkDialogMode, AttendanceOperationalStatus> = {
    excused: "EXCUSED_ABSENCE",
    unexcused: "UNEXCUSED_ABSENCE",
    late: "LATE",
    replacement: "REPLACEMENT_SERVED",
    voluntary: "VOLUNTARY_EXTRA_SERVICE",
  };
  return map[mode];
}

export function replacementTypeFromMode(mode: MarkDialogMode): AttendanceReplacementType | undefined {
  if (mode === "replacement") return "LEADER_ASSIGNED";
  if (mode === "voluntary") return "VOLUNTARY";
  return undefined;
}
