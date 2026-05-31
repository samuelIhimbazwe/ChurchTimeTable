"use client";

import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsCard } from "@/components/ui/cmms-card";

export function UnauthorizedState({
  title,
  description,
}: Readonly<{
  title?: string;
  description?: string;
}>) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <CmmsCard title={title ?? t("unauthorized")} className="max-w-md text-center">
        <CmmsAlert variant="warning">{description ?? t("unauthorized")}</CmmsAlert>
      </CmmsCard>
    </div>
  );
}
