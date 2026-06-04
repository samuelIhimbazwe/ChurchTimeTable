"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { http } from "@/core/api/http";

export function ChoirEquipmentPage() {
  const t = useTranslations("choirEquipment");
  const query = useQuery({
    queryKey: ["choir", "equipment", "dashboard"],
    queryFn: async () => {
      const res = await http.get("/choir/equipment/dashboard");
      return res.data.data as {
        totalAssets: number;
        activeAssignments: number;
        needsRepair: number;
        replacementNeeds: number;
      };
    },
  });
  const data = query.data;

  return (
    <OperationalScreen title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStateCard
          label={t("totalItems")}
          value={data?.totalAssets ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("activeAssignments")}
          value={data?.activeAssignments ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("needsRepair")}
          value={data?.needsRepair ?? 0}
          loading={query.isLoading}
        />
        <DashboardStateCard
          label={t("replacementNeeds")}
          value={data?.replacementNeeds ?? 0}
          loading={query.isLoading}
        />
      </div>
    </OperationalScreen>
  );
}
