"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { cn } from "@/core/utils/cn";

export function DashboardStatCard({
  label,
  value,
  description,
  tone = "default",
}: Readonly<{
  label: string;
  value: string | number;
  description?: string;
  tone?: "default" | "accent" | "warning";
}>) {
  const toneClass =
    tone === "accent"
      ? "border-transparent bg-[var(--surface-muted)]"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        : "bg-[var(--surface)]";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--border)] p-5 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]",
        toneClass,
      )}
    >
      <p className="cmms-text-label text-[var(--muted-foreground)]">{label}</p>
      <p className="cmms-text-display mt-2 text-[var(--foreground)]">{value}</p>
      {description ? (
        <p className="cmms-text-caption mt-2 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardStateCard({
  title,
  message,
}: Readonly<{
  title: string;
  message: string;
}>) {
  return (
    <CmmsCard title={title}>
      <CmmsEmptyState title={message} />
    </CmmsCard>
  );
}

export function AttendanceTrendChart({
  title,
  description,
  points,
}: Readonly<{
  title: string;
  description?: string;
  points: Array<{
    label: string;
    present?: number;
    absent?: number;
    late?: number;
    total?: number;
  }>;
}>) {
  const t = useTranslations("dashboard");
  const max = Math.max(...points.map((point) => point.total ?? 0), 1);

  return (
    <CmmsCard title={title} description={description}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs font-medium text-[var(--muted-foreground)]">
          <Legend swatch="bg-emerald-500" label={t("presentLabel")} />
          <Legend swatch="bg-amber-500" label={t("lateLabel")} />
          <Legend swatch="bg-rose-500" label={t("absentLabel")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {points.map((point) => {
            const total = point.total ?? 0;
            const present = point.present ?? 0;
            const late = point.late ?? 0;
            const absent = point.absent ?? 0;
            const height = total ? Math.max((total / max) * 100, 12) : 12;

            return (
              <div
                key={point.label}
                className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
              >
                <div className="flex items-end gap-3">
                  <div className="flex h-28 w-14 items-end rounded-[var(--radius-lg)] bg-[var(--surface)] p-2">
                    <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-muted)]">
                      <div
                        className="bg-emerald-500"
                        style={{
                          height: `${total ? (present / total) * height : 0}%`,
                        }}
                      />
                      <div
                        className="bg-amber-500"
                        style={{
                          height: `${total ? (late / total) * height : 0}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500"
                        style={{
                          height: `${total ? (absent / total) * height : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {point.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {total} {t("attendanceEntries")}
                    </p>
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      {present} {t("presentShort")} / {late} {t("lateShort")} / {absent}{" "}
                      {t("absentShort")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CmmsCard>
  );
}

export function DistributionChart({
  title,
  description,
  items,
}: Readonly<{
  title: string;
  description?: string;
  items: Array<{
    label: string;
    count: number;
  }>;
}>) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <CmmsCard title={title} description={description}>
      <div className="space-y-4">
        {items.map((item) => {
          const ratio = Math.round((item.count / total) * 100);

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-[var(--foreground)] break-words">
                  {item.label}
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {item.count} ({ratio}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-[var(--radius-pill)] bg-[var(--primary)]"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </CmmsCard>
  );
}

export function ProgressMeter({
  label,
  value,
  description,
}: Readonly<{
  label: string;
  value: number;
  description?: string;
}>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-sm text-[var(--muted-foreground)]">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-muted)]">
        <div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--primary)]"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      {description ? (
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      ) : null}
    </div>
  );
}

export function formatDateTime(value: string | Date) {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCurrency(amount: number, currency = "RWF") {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number | null) {
  if (value == null) {
    return "--";
  }

  return `${value}%`;
}

function Legend({
  swatch,
  label,
}: Readonly<{
  swatch: string;
  label: string;
}>) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", swatch)} />
      {label}
    </span>
  );
}
