"use client";

import { cn } from "@/core/utils/cn";

export interface CmmsTabItem {
  id: string;
  label: string;
}

export function CmmsTabs({
  items,
  activeId,
  onChange,
  className,
}: Readonly<{
  items: CmmsTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap gap-1 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-xs)]",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-[var(--surface-muted)] text-[var(--foreground)] shadow-[var(--shadow-xs)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
