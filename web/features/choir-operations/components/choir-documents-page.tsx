"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsTable } from "@/components/ui/cmms-table";
import { http } from "@/core/api/http";

export function ChoirDocumentsPage() {
  const t = useTranslations("choirDocuments");
  const query = useQuery({
    queryKey: ["choir", "documents"],
    queryFn: async () => {
      const res = await http.get("/choir/documents");
      return res.data.data as Array<{
        id: string;
        title: string;
        category: string;
        updatedAt: string;
      }>;
    },
  });

  return (
    <OperationalScreen title={t("title")} subtitle={t("subtitle")}>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <CmmsTable
          rows={query.data ?? []}
          columns={[
            { key: "title", header: t("titleCol"), render: (r) => r.title },
            { key: "category", header: t("category"), render: (r) => r.category },
            {
              key: "updated",
              header: t("updated"),
              render: (r) => new Date(r.updatedAt).toLocaleDateString(),
            },
          ]}
        />
      )}
    </OperationalScreen>
  );
}
