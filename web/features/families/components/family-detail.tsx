"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsModal } from "@/components/ui/cmms-modal";
import type { FamilyDetail, FamilyMetricsPayload } from "@/core/api/http";
import { formatMemberDirectoryPrimary } from "@/core/members/member-labels";
import { FamilyHealthCard } from "@/features/families/components/family-health-card";

export function FamilyDetailPanel({
  family,
  metrics,
  metricsLoading,
  canManage,
  busy,
  onEdit,
  onDelete,
  onAddMember,
  onRemoveMember,
  onSetHead,
}: Readonly<{
  family: FamilyDetail;
  metrics?: FamilyMetricsPayload | null;
  metricsLoading?: boolean;
  canManage: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddMember: (memberId: string, role?: string) => Promise<unknown>;
  onRemoveMember: (memberId: string) => Promise<unknown>;
  onSetHead: (memberId: string) => Promise<unknown>;
}>) {
  const t = useTranslations("families");
  const [memberId, setMemberId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {metrics ? <FamilyHealthCard metrics={metrics} /> : null}
      {metricsLoading ? (
        <p className="text-sm text-[var(--muted-foreground)]">{t("loadingDetail")}</p>
      ) : null}

      <CmmsCard title={family.familyName} description={family.familyCode}>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted-foreground)]">{t("fields.head")}</dt>
            <dd>
              {family.headMember
                ? formatMemberDirectoryPrimary({
                    memberNumber: family.headMember.memberNumber,
                    firstName: family.headMember.firstName,
                    lastName: family.headMember.lastName,
                  })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">{t("columns.members")}</dt>
            <dd>{family.members.length}</dd>
          </div>
        </dl>
        {family.notes ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">{family.notes}</p>
        ) : null}
        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <CmmsButton variant="secondary" disabled={busy} onClick={onEdit}>
              {t("editFamily")}
            </CmmsButton>
            <CmmsButton variant="secondary" disabled={busy} onClick={onDelete}>
              {t("deleteFamily")}
            </CmmsButton>
          </div>
        ) : null}
      </CmmsCard>

      {canManage ? (
        <CmmsCard title={t("addMemberTitle")} description={t("addMemberHint")}>
          <div className="flex flex-wrap items-end gap-3">
            <CmmsFormField label={t("fields.memberId")} htmlFor="memberId">
              <CmmsInput
                id="memberId"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              />
            </CmmsFormField>
            <CmmsFormField label={t("fields.role")} htmlFor="memberRole">
              <CmmsInput
                id="memberRole"
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value)}
              />
            </CmmsFormField>
            <CmmsButton
              variant="primary"
              disabled={busy || !memberId.trim()}
              onClick={() =>
                void onAddMember(memberId.trim(), memberRole.trim() || undefined).then(() => {
                  setMemberId("");
                })
              }
            >
              {t("addMember")}
            </CmmsButton>
          </div>
        </CmmsCard>
      ) : null}

      <CmmsCard title={t("membersTitle")}>
        <CmmsTable
          compact
          rows={family.members}
          columns={[
            {
              key: "member",
              header: t("columns.member"),
              render: (row) =>
                formatMemberDirectoryPrimary({
                  memberNumber: row.member.memberNumber,
                  firstName: row.member.firstName,
                  lastName: row.member.lastName,
                }),
            },
            {
              key: "role",
              header: t("fields.role"),
              render: (row) => row.role,
            },
            ...(canManage
              ? [
                  {
                    key: "actions",
                    header: t("columns.actions"),
                    render: (row: FamilyDetail["members"][number]) => (
                      <div className="flex flex-wrap gap-2">
                        <CmmsButton
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onSetHead(row.memberId)}
                        >
                          {t("setHead")}
                        </CmmsButton>
                        <CmmsButton
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => setRemoveTarget(row.memberId)}
                        >
                          {t("removeMember")}
                        </CmmsButton>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </CmmsCard>

      <CmmsModal
        open={removeTarget != null}
        onClose={() => setRemoveTarget(null)}
        title={t("removeMemberConfirmTitle")}
        footer={
          <div className="flex justify-end gap-2">
            <CmmsButton variant="secondary" onClick={() => setRemoveTarget(null)}>
              {t("cancel")}
            </CmmsButton>
            <CmmsButton
              variant="primary"
              disabled={busy}
              onClick={() => {
                if (!removeTarget) return;
                void onRemoveMember(removeTarget).finally(() => setRemoveTarget(null));
              }}
            >
              {t("removeMember")}
            </CmmsButton>
          </div>
        }
      >
        <p className="text-sm text-[var(--muted-foreground)]">{t("removeMemberConfirmBody")}</p>
      </CmmsModal>
    </div>
  );
}
