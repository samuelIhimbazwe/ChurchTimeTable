"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsTable } from "@/components/ui/cmms-table";
import type { FamilySummary } from "@/core/api/http";
import { formatMemberDirectoryPrimary } from "@/core/members/member-labels";

type SortMode = "name" | "scoreDesc" | "scoreAsc";

export function FamilyList({
  families,
  selectedId,
  onSelect,
  onCreate,
  canManage,
}: Readonly<{
  families: FamilySummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  canManage: boolean;
}>) {
  const t = useTranslations("families");
  const [sortMode, setSortMode] = useState<SortMode>("name");

  const sortedFamilies = useMemo(() => {
    const rows = [...families];
    if (sortMode === "scoreDesc") {
      return rows.sort(
        (a, b) => (b.healthScore ?? -1) - (a.healthScore ?? -1),
      );
    }
    if (sortMode === "scoreAsc") {
      return rows.sort(
        (a, b) => (a.healthScore ?? 101) - (b.healthScore ?? 101),
      );
    }
    return rows.sort((a, b) => a.familyName.localeCompare(b.familyName));
  }, [families, sortMode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <CmmsButton
            size="sm"
            variant={sortMode === "name" ? "primary" : "secondary"}
            onClick={() => setSortMode("name")}
          >
            {t("metrics.sortDefault")}
          </CmmsButton>
          <CmmsButton
            size="sm"
            variant={sortMode === "scoreDesc" ? "primary" : "secondary"}
            onClick={() => setSortMode("scoreDesc")}
          >
            {t("metrics.sortHighest")}
          </CmmsButton>
          <CmmsButton
            size="sm"
            variant={sortMode === "scoreAsc" ? "primary" : "secondary"}
            onClick={() => setSortMode("scoreAsc")}
          >
            {t("metrics.sortLowest")}
          </CmmsButton>
        </div>
        {canManage ? (
          <CmmsButton variant="primary" onClick={onCreate}>
            {t("createFamily")}
          </CmmsButton>
        ) : null}
      </div>
      <CmmsTable
        compact
        rows={sortedFamilies}
        columns={[
          {
            key: "code",
            header: t("columns.code"),
            render: (row) => row.familyCode,
          },
          {
            key: "name",
            header: t("columns.name"),
            render: (row) => row.familyName,
          },
          {
            key: "health",
            header: t("metrics.healthScore"),
            render: (row) =>
              row.healthScore != null ? `${row.healthScore} (${row.healthGrade ?? "—"})` : "—",
          },
          {
            key: "head",
            header: t("columns.head"),
            render: (row) =>
              row.headMember
                ? formatMemberDirectoryPrimary({
                    memberNumber: row.headMember.memberNumber,
                    firstName: row.headMember.firstName,
                    lastName: row.headMember.lastName,
                  })
                : "—",
          },
          {
            key: "members",
            header: t("columns.members"),
            render: (row) => row.memberCount,
          },
          {
            key: "actions",
            header: t("columns.actions"),
            render: (row) => (
              <CmmsButton
                size="sm"
                variant={row.id === selectedId ? "primary" : "secondary"}
                onClick={() => onSelect(row.id)}
              >
                {t("view")}
              </CmmsButton>
            ),
          },
        ]}
      />
    </div>
  );
}
