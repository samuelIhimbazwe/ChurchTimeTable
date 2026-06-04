"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  useMemberStatusHistoryQuery,
  useUpdateMemberStatusMutation,
} from "@/features/member-profile/hooks/use-member-profile";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MemberStatusPanel({
  memberId,
  currentStatus,
  allowedTransitions,
}: Readonly<{
  memberId: string;
  currentStatus: string;
  allowedTransitions: string[];
}>) {
  const t = useTranslations("memberProfile.statusPanel");
  const historyQuery = useMemberStatusHistoryQuery(memberId);
  const mutation = useUpdateMemberStatusMutation(memberId);
  const [nextStatus, setNextStatus] = useState(allowedTransitions[0] ?? "");
  const [reason, setReason] = useState("");

  if (allowedTransitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <CmmsCard title={t("changeTitle")} description={t("changeHint", { status: currentStatus })}>
        <form
          className="cmms-section-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nextStatus) return;
            void mutation.mutateAsync({
              status: nextStatus,
              reason: reason.trim() || undefined,
            });
          }}
        >
          <CmmsFormField label={t("newStatus")} htmlFor="newStatus">
            <select
              id="newStatus"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
            >
              {allowedTransitions.map((status) => (
                <option key={status} value={status}>
                  {t(`values.${status}`, { defaultValue: status })}
                </option>
              ))}
            </select>
          </CmmsFormField>

          <CmmsFormField label={t("reason")} htmlFor="reason">
            <CmmsInput
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("reasonPlaceholder")}
            />
          </CmmsFormField>

          {mutation.isError ? (
            <p className="text-sm text-[var(--danger)]">{t("changeError")}</p>
          ) : null}

          <CmmsButton type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("apply")}
          </CmmsButton>
        </form>
      </CmmsCard>

      <CmmsCard title={t("historyTitle")}>
        {historyQuery.isLoading ? (
          <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
        ) : (
          <CmmsTable
            compact
            rows={historyQuery.data ?? []}
            columns={[
              {
                key: "transition",
                header: t("transition"),
                render: (row) =>
                  row.fromStatus
                    ? `${row.fromStatus} → ${row.toStatus}`
                    : row.toStatus,
              },
              {
                key: "reason",
                header: t("reason"),
                render: (row) => row.reason ?? "—",
              },
              {
                key: "when",
                header: t("when"),
                render: (row) => formatDate(row.createdAt),
              },
            ]}
          />
        )}
      </CmmsCard>
    </div>
  );
}
