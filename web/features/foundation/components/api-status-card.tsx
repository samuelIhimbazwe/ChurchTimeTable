"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { env } from "@/core/config/env";
import { probeApiConnection } from "@/core/api/http";

export function ApiStatusCard() {
  const t = useTranslations("foundation");
  const locale = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["foundation", "api-status"],
    queryFn: probeApiConnection,
  });

  const connected = data?.reachable ?? false;

  return (
    <CmmsCard title={t("apiStatus")} description={t("description")}>
      <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <div className="flex items-center gap-3">
          <span
            className="inline-block size-3 rounded-full"
            style={{
              backgroundColor: connected ? "var(--success)" : "var(--warning)",
            }}
          />
          <span>
            {isLoading
              ? t("apiStatus")
              : connected
                ? t("apiReachable")
                : t("apiUnreachable")}
          </span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4">
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("apiBaseUrl")}
            </dt>
            <dd className="mt-1 break-all text-[var(--foreground)]">
              {env.NEXT_PUBLIC_API_BASE_URL}
            </dd>
          </div>
          <div className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4">
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("activeLocale")}
            </dt>
            <dd className="mt-1 text-[var(--foreground)]">
              {locale.toUpperCase()}
            </dd>
          </div>
          <div className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4">
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("environment")}
            </dt>
            <dd className="mt-1 text-[var(--foreground)]">
              {env.NEXT_PUBLIC_APP_ENV}
            </dd>
          </div>
          <div className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4">
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("routeGuard")}
            </dt>
            <dd className="mt-1 text-[var(--foreground)]">
              {t("routeGuardValue")}
            </dd>
          </div>
        </dl>
      </div>
    </CmmsCard>
  );
}
