"use client";

import type { DashboardWidgetConfig } from "@/core/api/types";

export function hasWidget(
  widgets: DashboardWidgetConfig[] | undefined,
  id: string,
): boolean {
  return widgets?.some((w) => w.id === id) ?? false;
}

export function widgetPriority(
  widgets: DashboardWidgetConfig[] | undefined,
  id: string,
): number {
  return widgets?.find((w) => w.id === id)?.priority ?? 999;
}

export function sortByWidgetPriority(
  widgets: DashboardWidgetConfig[] | undefined,
  ids: string[],
): string[] {
  return [...ids].sort(
    (a, b) => widgetPriority(widgets, a) - widgetPriority(widgets, b),
  );
}
