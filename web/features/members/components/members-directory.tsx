"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { Link } from "@/i18n/routing";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { fetchMembers, getApiErrorMessage, type MemberListItem } from "@/core/api/http";
import { formatMemberDirectoryPrimary } from "@/core/members/member-labels";
import { useQuery } from "@tanstack/react-query";

type StatusTab = "ALL" | "ACTIVE" | "NEW_MEMBER" | "TEMPORARILY_INACTIVE";

function memberStatusVariant(status: string) {
  if (status === "ACTIVE" || status === "NEW_MEMBER") return "success" as const;
  if (status === "PROBATION" || status === "TEMPORARILY_INACTIVE") return "warning" as const;
  if (status === "SUSPENDED" || status === "DISCIPLINE") return "danger" as const;
  return "neutral" as const;
}

function memberStatusLabel(status: string, t: (key: string) => string) {
  const normalized =
    status === "PENDING"
      ? "NEW_MEMBER"
      : status === "INACTIVE"
        ? "TEMPORARILY_INACTIVE"
        : status;
  const known = [
    "NEW_MEMBER",
    "ACTIVE",
    "PROBATION",
    "TEMPORARILY_INACTIVE",
    "SUSPENDED",
    "DISCIPLINE",
  ];
  if (known.includes(normalized)) {
    return t(`status.${normalized}`);
  }
  return status;
}

function formatJoined(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function MemberNameCell({ item }: Readonly<{ item: MemberListItem }>) {
  const initials = `${item.firstName?.[0] ?? ""}${item.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--primary)]">
        {initials}
      </div>
      <div className="min-w-0">
        {item.memberNumber ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {formatMemberDirectoryPrimary(item)}
          </p>
        ) : null}
        <p className="font-medium text-[var(--foreground)]">
          {item.firstName} {item.lastName}
        </p>
        {item.user?.email ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{item.user.email}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MembersDirectory() {
  const t = useTranslations("members.directory");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");

  const query = useQuery({
    queryKey: ["members", "directory", statusTab],
    queryFn: () =>
      fetchMembers(
        statusTab === "ALL"
          ? { includeAllStatuses: true, limit: 200 }
          : { status: statusTab, limit: 200 },
      ),
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

  if (query.isLoading) {
    return <CmmsDashboardSkeleton />;
  }

  if (query.isError) {
    return (
      <CmmsCard title={t("loadError")}>
        <CmmsEmptyState title={t("loadError")} description={getApiErrorMessage(query.error, t("loadError"))} />
      </CmmsCard>
    );
  }

  return (
    <div className="cmms-page-stack">
      <CmmsCard headerAction={
          <CmmsButton type="button" size="sm">
            {t("addMember")}
          </CmmsButton>
        }
      >
        <div className="cmms-section-stack">
          <CmmsTabs
            items={[
              { id: "ALL", label: t("tabs.all") },
              { id: "ACTIVE", label: t("tabs.active") },
              { id: "NEW_MEMBER", label: t("tabs.newMember") },
              { id: "TEMPORARILY_INACTIVE", label: t("tabs.inactive") },
            ]}
            activeId={statusTab}
            onChange={(id) => setStatusTab(id as StatusTab)}
          />

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <CmmsInput
              id="members-search"
              label={t("search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <CmmsButton type="button" variant="secondary" size="md" className="self-end">
              {t("filter")}
            </CmmsButton>
          </div>
        </div>
      </CmmsCard>

      <CmmsTable<MemberListItem>
        columns={[
          {
            key: "name",
            header: t("name"),
            render: (item) => <MemberNameCell item={item} />,
          },
          {
            key: "ministry",
            header: t("ministry"),
            render: (item) => <CmmsBadge variant="info">{item.ministry}</CmmsBadge>,
          },
          {
            key: "role",
            header: t("role"),
            render: () => t("roleMember"),
          },
          {
            key: "status",
            header: t("status"),
            render: (item) => (
              <CmmsBadge variant={memberStatusVariant(item.status)}>
                {memberStatusLabel(item.status, t)}
              </CmmsBadge>
            ),
          },
          {
            key: "joined",
            header: t("joined"),
            render: (item) => formatJoined(item.createdAt),
          },
          {
            key: "actions",
            header: t("actions"),
            className: "w-28",
            render: (item) => (
              <Link
                href={`/dashboard/members/${item.id}`}
                className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              >
                {t("viewProfile")}
              </Link>
            ),
          },
        ]}
        rows={filtered}
        emptyState={<CmmsEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />}
      />
    </div>
  );
}
