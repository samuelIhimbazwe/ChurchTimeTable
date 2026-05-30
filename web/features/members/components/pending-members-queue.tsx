"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  fetchMembers,
  getApiErrorMessage,
  updateMemberStatus,
  type MemberListItem,
} from "@/core/api/http";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function PendingMembersQueue() {
  const t = useTranslations("members.pending");
  const [search, setSearch] = useState("");
  const [ministry, setMinistry] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["members", "pending", ministry],
    queryFn: () =>
      fetchMembers({
        status: "PENDING",
        ministry: ministry || undefined,
        limit: 200,
      }),
  });

  const filtered = useMemo(() => {
    const items = query.data?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.firstName,
        item.lastName,
        item.user?.email ?? "",
        item.ministry,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query.data?.items, search]);

  async function handleStatus(memberId: string, status: "ACTIVE" | "INACTIVE") {
    setActionId(memberId);
    setError(null);
    try {
      await updateMemberStatus(memberId, status);
      await queryClient.invalidateQueries({ queryKey: ["members", "pending"] });
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, t("actionFailed")));
    } finally {
      setActionId(null);
    }
  }

  if (query.isLoading) {
    return <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>;
  }

  return (
    <div className="cmms-page-stack">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <CmmsInput
          id="pending-search"
          label={t("search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">{t("ministryFilter")}</span>
          <CmmsSelect value={ministry} onChange={(event) => setMinistry(event.target.value)}>
            <option value="">{t("allMinistries")}</option>
            <option value="CHOIR">{t("ministryChoir")}</option>
            <option value="PROTOCOL">{t("ministryProtocol")}</option>
            <option value="BOTH">{t("ministryBoth")}</option>
          </CmmsSelect>
        </label>
      </div>

      {error ? (
        <p className="rounded-[var(--radius-xl)] bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <CmmsEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <CmmsTable<MemberListItem>
          columns={[
            {
              key: "name",
              header: t("name"),
              render: (member) => `${member.firstName} ${member.lastName}`,
            },
            {
              key: "email",
              header: t("email"),
              render: (member) => member.user?.email ?? "—",
            },
            {
              key: "ministry",
              header: t("ministry"),
              render: (member) => (
                <CmmsBadge variant="neutral">{member.ministry}</CmmsBadge>
              ),
            },
            {
              key: "submitted",
              header: t("submitted"),
              render: (member) =>
                member.createdAt
                  ? new Date(member.createdAt).toLocaleDateString()
                  : "—",
            },
            {
              key: "actions",
              header: t("actions"),
              render: (member) => (
                <div className="flex flex-wrap gap-2">
                  <CmmsButton
                    type="button"
                    size="sm"
                    disabled={actionId === member.id}
                    onClick={() => handleStatus(member.id, "ACTIVE")}
                  >
                    {t("approve")}
                  </CmmsButton>
                  <CmmsButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={actionId === member.id}
                    onClick={() => handleStatus(member.id, "INACTIVE")}
                  >
                    {t("reject")}
                  </CmmsButton>
                </div>
              ),
            },
          ]}
          rows={filtered}
        />
      )}
    </div>
  );
}
