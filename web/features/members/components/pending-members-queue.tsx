"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { CmmsTable } from "@/components/ui/cmms-table";
import { DonutChart, CHART_SEGMENT_COLORS } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchMembers,
  getApiErrorMessage,
  updateMemberStatus,
  type MemberListItem,
} from "@/core/api/http";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function MemberNameCell({ item }: Readonly<{ item: MemberListItem }>) {
  const initials = `${item.firstName?.[0] ?? ""}${item.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--primary)]">
        {initials}
      </div>
      <span className="font-medium text-[var(--foreground)]">
        {item.firstName} {item.lastName}
      </span>
    </div>
  );
}

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

  const ministryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of query.data?.items ?? []) {
      counts.set(item.ministry, (counts.get(item.ministry) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  }, [query.data?.items]);

  const summarySegments = ministryCounts.map((item, index) => ({
    label: item.label,
    count: item.count,
    color: CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length],
  }));

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

      {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {filtered.length === 0 ? (
          <CmmsEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <CmmsTable<MemberListItem>
            columns={[
              {
                key: "name",
                header: t("name"),
                render: (member) => <MemberNameCell item={member} />,
              },
              {
                key: "ministry",
                header: t("ministry"),
                render: (member) => <CmmsBadge variant="info">{member.ministry}</CmmsBadge>,
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
                      variant="danger"
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

        <DonutChart
          title={t("summaryTitle")}
          description={t("summaryHint")}
          centerValue={filtered.length}
          centerLabel={t("title")}
          segments={
            summarySegments.length > 0
              ? summarySegments
              : [{ label: t("emptyTitle"), count: 1, color: "var(--chart-muted)" }]
          }
        />
      </div>
    </div>
  );
}
