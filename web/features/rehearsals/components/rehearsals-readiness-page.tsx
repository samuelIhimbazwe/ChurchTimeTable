"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsTable } from "@/components/ui/cmms-table";
import { http } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function RehearsalsReadinessPage() {
  const t = useTranslations("rehearsals");

  const query = useQuery({
    queryKey: ["rehearsals", "readiness"],
    queryFn: async () => {
      const res = await http.get("/choir/rehearsals/readiness");
      return res.data.data as Array<{
        sectionId: string;
        name: string;
        code: string;
        readiness: number;
        assignedSongs: number;
        unresolvedIssues: number;
        leaderNotes: string;
      }>;
    },
  });

  return (
    <OperationalScreen title={t("readinessTitle")} subtitle={t("readinessSubtitle")}>
      <Link href="/dashboard/rehearsals" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToRehearsals")}
      </Link>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : null}
      <CmmsTable
        rows={query.data ?? []}
        columns={[
          { key: "name", header: t("section"), render: (r) => r.name },
          { key: "readiness", header: t("readinessLabel"), render: (r) => `${r.readiness}%` },
          { key: "songs", header: t("assignedSongs"), render: (r) => r.assignedSongs },
          { key: "issues", header: t("unresolvedIssues"), render: (r) => r.unresolvedIssues },
          { key: "notes", header: t("leaderNotes"), render: (r) => r.leaderNotes || "—" },
        ]}
      />
    </OperationalScreen>
  );
}
