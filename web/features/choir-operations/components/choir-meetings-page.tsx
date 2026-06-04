"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTable } from "@/components/ui/cmms-table";
import { http } from "@/core/api/http";

export function ChoirMeetingsPage() {
  const t = useTranslations("choirMeetings");

  const meetingsQuery = useQuery({
    queryKey: ["choir", "meetings"],
    queryFn: async () => {
      const res = await http.get("/choir/meetings");
      return res.data.data as Array<{
        id: string;
        title: string;
        scheduledAt: string;
        status: string;
      }>;
    },
  });

  const actionsQuery = useQuery({
    queryKey: ["choir", "meetings", "action-reports"],
    queryFn: async () => {
      const res = await http.get("/choir/meetings/reports/actions");
      return res.data.data as {
        open: number;
        overdue: number;
        completed: number;
      };
    },
  });

  return (
    <OperationalScreen title={t("title")} subtitle={t("subtitle")}>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <CmmsCard title={t("openActions")}>
          <p className="text-2xl font-semibold">{actionsQuery.data?.open ?? 0}</p>
        </CmmsCard>
        <CmmsCard title={t("overdueActions")}>
          <p className="text-2xl font-semibold">{actionsQuery.data?.overdue ?? 0}</p>
        </CmmsCard>
        <CmmsCard title={t("completedActions")}>
          <p className="text-2xl font-semibold">{actionsQuery.data?.completed ?? 0}</p>
        </CmmsCard>
      </div>
      {meetingsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <CmmsTable
          rows={meetingsQuery.data ?? []}
          columns={[
            { key: "title", header: t("meetingTitle"), render: (r) => r.title },
            {
              key: "scheduled",
              header: t("scheduled"),
              render: (r) => new Date(r.scheduledAt).toLocaleString(),
            },
            { key: "status", header: t("status"), render: (r) => r.status },
          ]}
        />
      )}
    </OperationalScreen>
  );
}
