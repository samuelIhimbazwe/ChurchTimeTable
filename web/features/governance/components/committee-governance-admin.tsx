"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsPageSection } from "@/components/ui/cmms-page-section";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { CmmsSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { getApiErrorMessage } from "@/core/api/errors";
import { formatMemberPickerLabel } from "@/core/members/member-labels";
import {
  CHOIR_GOVERNANCE_SCOPE,
  PROTOCOL_GOVERNANCE_SCOPE,
} from "@/core/governance/scopes";
import {
  useAssignChoirMemberMutation,
  useAssignProtocolMemberMutation,
  useChoirCommitteeQuery,
  useGovernanceMembersQuery,
  useProtocolCommitteeQuery,
} from "@/features/governance/hooks/use-governance-admin";

type GovernanceTab = "protocol" | "choir";

export function CommitteeGovernanceAdmin() {
  const t = useTranslations("governanceAdmin");
  const [tab, setTab] = useState<GovernanceTab>("protocol");
  const [memberId, setMemberId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const protocolQuery = useProtocolCommitteeQuery(tab === "protocol");
  const choirQuery = useChoirCommitteeQuery(tab === "choir");
  const protocolMembersQuery = useGovernanceMembersQuery("PROTOCOL", tab === "protocol");
  const choirMembersQuery = useGovernanceMembersQuery("CHOIR", tab === "choir");

  const assignProtocol = useAssignProtocolMemberMutation();
  const assignChoir = useAssignChoirMemberMutation();

  const snapshot = tab === "protocol" ? protocolQuery.data : choirQuery.data;
  const roster =
    tab === "protocol" ? protocolMembersQuery.data?.items : choirMembersQuery.data?.items;
  const scopeId =
    tab === "protocol" ? PROTOCOL_GOVERNANCE_SCOPE : CHOIR_GOVERNANCE_SCOPE;
  const isPending = assignProtocol.isPending || assignChoir.isPending;
  const loading =
    (tab === "protocol" ? protocolQuery.isLoading : choirQuery.isLoading) ||
    (tab === "protocol" ? protocolMembersQuery.isLoading : choirMembersQuery.isLoading);

  async function handleAssign() {
    if (!memberId || !roleId) {
      setError(t("assignValidation"));
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      if (tab === "protocol") {
        await assignProtocol.mutateAsync({ scopeId, memberId, roleId });
      } else {
        await assignChoir.mutateAsync({ scopeId, memberId, roleId });
      }
      setMemberId("");
      setRoleId("");
      setSuccess(t("assignSuccess"));
    } catch (assignError) {
      setError(getApiErrorMessage(assignError, t("assignFailed")));
    }
  }

  function resetForm() {
    setMemberId("");
    setRoleId("");
    setError(null);
    setSuccess(null);
  }

  return (
    <OperationalScreen
      tabs={[
        { id: "protocol", label: t("tabs.protocol") },
        { id: "choir", label: t("tabs.choir") },
      ]}
      activeTabId={tab}
      onTabChange={(id) => {
        setTab(id as GovernanceTab);
        resetForm();
      }}
      error={error}
      success={success}
    >
      <CmmsPageSection title={t("assignTitle")} description={t("assignDescription")}>
        <CmmsCard>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CmmsSkeleton className="h-11" />
              <CmmsSkeleton className="h-11" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <CmmsFormField label={t("memberLabel")} required>
                <CmmsSelect
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                >
                  <option value="">{t("memberPlaceholder")}</option>
                  {roster?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {formatMemberPickerLabel(member)}
                    </option>
                  ))}
                </CmmsSelect>
              </CmmsFormField>
              <CmmsFormField label={t("roleLabel")} required>
                <CmmsSelect value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                  <option value="">{t("rolePlaceholder")}</option>
                  {snapshot?.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </CmmsSelect>
              </CmmsFormField>
            </div>
          )}
          <div className="mt-6">
            <CmmsButton onClick={() => void handleAssign()} disabled={isPending || loading}>
              {isPending ? t("assigning") : t("assignAction")}
            </CmmsButton>
          </div>
        </CmmsCard>
      </CmmsPageSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <CmmsCard title={t("rolesTitle")} description={t("rolesDescription")}>
          {loading ? (
            <CmmsSkeleton className="h-32" />
          ) : snapshot?.roles.length ? (
            <ul className="space-y-2">
              {snapshot.roles.map((role) => {
                const permissions = Array.isArray(role.permissionsJson)
                  ? (role.permissionsJson as string[])
                  : [];
                return (
                  <li
                    key={role.id}
                    className="rounded-[var(--radius-xl)] border border-[var(--border)] px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{role.name}</span>
                    <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                      {permissions.length ? permissions.join(" · ") : t("noPermissions")}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <CmmsEmptyState
              title={t("emptyRolesTitle")}
              description={t("emptyRolesDescription")}
            />
          )}
        </CmmsCard>

        <CmmsCard title={t("assignmentsTitle")} description={t("assignmentsDescription")}>
          <CmmsTable
            columns={[
              {
                key: "member",
                header: t("columns.member"),
                render: (row) =>
                  formatMemberPickerLabel({
                    memberNumber: row.member.memberNumber,
                    firstName: row.member.firstName,
                    lastName: row.member.lastName,
                  }),
              },
              {
                key: "role",
                header: t("columns.role"),
                render: (row) => row.role.name,
              },
              {
                key: "ministry",
                header: t("columns.ministry"),
                render: (row) => row.member.ministry,
              },
            ]}
            rows={snapshot?.members ?? []}
            emptyState={
              <CmmsEmptyState
                title={t("noAssignmentsTitle")}
                description={t("noAssignments")}
              />
            }
          />
        </CmmsCard>
      </div>
    </OperationalScreen>
  );
}
