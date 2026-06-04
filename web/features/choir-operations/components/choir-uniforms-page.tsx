"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { http } from "@/core/api/http";

export function ChoirUniformsPage() {
  const t = useTranslations("choirUniforms");
  const query = useQuery({
    queryKey: ["choir", "uniforms", "dashboard"],
    queryFn: async () => {
      const res = await http.get("/choir/uniforms/dashboard");
      return res.data.data as {
        missing: number;
        damaged: number;
        replacementNeeds: number;
        activeAssignments: number;
      };
    },
  });
  const data = query.data;

  return (
    <OperationalScreen title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStateCard
          label={t("missing")}
          value={data?.missing ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("damaged")}
          value={data?.damaged ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("replacementNeeded")}
          value={data?.replacementNeeds ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("activeAssignments")}
          value={data?.activeAssignments ?? 0}
          loading={query.isLoading}
        />
      </div>
    </OperationalScreen>
  );
}
