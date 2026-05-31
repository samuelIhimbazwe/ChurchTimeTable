"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { cn } from "@/core/utils/cn";

export function DashboardStatCard({
  label,
  value,
  description,
  trend,
  tone = "default",
}: Readonly<{
  label: string;
  value: string | number;
  description?: string;
  trend?: { value: string; direction?: "up" | "down" | "neutral" };
  tone?: "default" | "accent" | "warning";
}>) {
  const toneClass =
    tone === "accent"
      ? "border-transparent bg-[var(--surface-muted)]"
      : tone === "warning"
        ? "border-[var(--warning)]/20 bg-[var(--warning-surface)]"
        : "bg-[var(--surface)]";

  const trendClass =
    trend?.direction === "up"
      ? "text-[var(--success)]"
      : trend?.direction === "down"
        ? "text-[var(--danger)]"
        : "text-[var(--muted-foreground)]";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--border)] p-5 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]",
        toneClass,
      )}
    >
      <p className="cmms-text-label text-[var(--muted-foreground)]">{label}</p>
      <p className="cmms-text-display mt-2 text-[var(--foreground)]">{value}</p>
      {trend ? (
        <p className={cn("mt-2 text-xs font-semibold", trendClass)}>{trend.value}</p>
      ) : null}
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
          <Legend swatch="bg-[var(--success)]" label={t("presentLabel")} />
          <Legend swatch="bg-[var(--warning)]" label={t("lateLabel")} />
          <Legend swatch="bg-[var(--danger)]" label={t("absentLabel")} />
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
                        className="bg-[var(--success)]"
                        style={{
                          height: `${total ? (present / total) * height : 0}%`,
                        }}
                      />
                      <div
                        className="bg-[var(--warning)]"
                        style={{
                          height: `${total ? (late / total) * height : 0}%`,
                        }}
                      />
                      <div
                        className="bg-[var(--danger)]"
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

export const CHART_SEGMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const;

export function DonutChart({
  title,
  description,
  centerValue,
  centerLabel,
  segments,
}: Readonly<{
  title: string;
  description?: string;
  centerValue: string | number;
  centerLabel: string;
  segments: Array<{ label: string; count: number; color: string }>;
}>) {
  const total = segments.reduce((sum, item) => sum + item.count, 0) || 1;
  let offset = 0;
  const gradientStops = segments
    .map((segment) => {
      const ratio = (segment.count / total) * 100;
      const start = offset;
      offset += ratio;
      return `${segment.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <CmmsCard title={title} description={description}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops || "var(--surface-muted) 0% 100%"})`,
          }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center">
            <span className="text-2xl font-semibold text-[var(--foreground)]">{centerValue}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{centerLabel}</span>
          </div>
        </div>
        <div className="w-full space-y-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-[var(--foreground)]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="text-[var(--muted-foreground)]">{segment.count}</span>
            </div>
          ))}
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
