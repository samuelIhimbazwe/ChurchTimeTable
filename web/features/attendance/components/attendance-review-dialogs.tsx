"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsSelect } from "@/components/ui/cmms-select";

const ESCALATION_LEVELS = ["TEAM_HEAD", "COORDINATOR", "PRESIDENT"] as const;

export function AttendanceEscalationDialog({
  open,
  memberName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  memberName: string;
  onClose: () => void;
  onSubmit: (input: {
    level: (typeof ESCALATION_LEVELS)[number];
    notes?: string;
  }) => Promise<void>;
}) {
  const t = useTranslations("attendance");
  const [level, setLevel] = useState<(typeof ESCALATION_LEVELS)[number]>("COORDINATOR");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ level, notes: notes.trim() || undefined });
      setNotes("");
      onClose();
    } catch {
      setError(t("escalationDialog.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={t("escalationDialog.title", { member: memberName })}
      closeLabel={t("markDialog.cancel")}
      footer={
        <div className="flex justify-end gap-2">
          <CmmsButton variant="secondary" onClick={onClose} disabled={submitting}>
            {t("markDialog.cancel")}
          </CmmsButton>
          <CmmsButton variant="primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t("escalationDialog.submitting") : t("escalationDialog.submit")}
          </CmmsButton>
        </div>
      }
    >
      <div className="cmms-section-stack">
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        <p className="cmms-text-body text-[var(--muted-foreground)]">
          {t("escalationDialog.description")}
        </p>
        <CmmsFormField label={t("escalationDialog.level")} required>
          <CmmsSelect
            value={level}
            onChange={(event) =>
              setLevel(event.target.value as (typeof ESCALATION_LEVELS)[number])
            }
          >
            {ESCALATION_LEVELS.map((item) => (
              <option key={item} value={item}>
                {t(`escalationDialog.levels.${item}`)}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>
        <CmmsFormField
          label={t("escalationDialog.notes")}
          hint={t("escalationDialog.notesHint")}
        >
          <CmmsInput value={notes} onChange={(event) => setNotes(event.target.value)} />
        </CmmsFormField>
      </div>
    </CmmsModal>
  );
}

export function AttendanceExcuseReviewDialog({
  open,
  mode,
  memberName,
  excuseReason,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "approve" | "reject" | null;
  memberName: string;
  excuseReason?: string | null;
  onClose: () => void;
  onSubmit: (input: { approve: boolean; notes?: string }) => Promise<void>;
}) {
  const t = useTranslations("attendance");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mode) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        approve: mode === "approve",
        notes: notes.trim() || undefined,
      });
      setNotes("");
      onClose();
    } catch {
      setError(t("excuseActionDialog.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const titleKey = mode === "approve" ? "approveTitle" : "rejectTitle";
  const confirmKey = mode === "approve" ? "confirmApprove" : "confirmReject";

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={t(`excuseActionDialog.${titleKey}`, { member: memberName })}
      closeLabel={t("markDialog.cancel")}
      footer={
        <div className="flex justify-end gap-2">
          <CmmsButton variant="secondary" onClick={onClose} disabled={submitting}>
            {t("markDialog.cancel")}
          </CmmsButton>
          <CmmsButton
            variant={mode === "approve" ? "primary" : "secondary"}
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? t("excuseActionDialog.submitting") : t(`excuseActionDialog.${confirmKey}`)}
          </CmmsButton>
        </div>
      }
    >
      <div className="cmms-section-stack">
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        {excuseReason ? (
          <CmmsFormField label={t("markDialog.notes")}>
            <p className="cmms-text-body text-[var(--foreground)]">{excuseReason}</p>
          </CmmsFormField>
        ) : null}
        {mode === "reject" ? (
          <CmmsFormField label={t("excuseActionDialog.rejectionReason")}>
            <CmmsInput value={notes} onChange={(event) => setNotes(event.target.value)} />
          </CmmsFormField>
        ) : (
          <p className="cmms-text-body text-[var(--muted-foreground)]">
            {t("excuseActionDialog.approveHint")}
          </p>
        )}
      </div>
    </CmmsModal>
  );
}
