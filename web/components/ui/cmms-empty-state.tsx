import type { ReactNode } from "react";

import { CmmsButton } from "@/components/ui/cmms-button";
import { cn } from "@/core/utils/cn";

type CmmsEmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
};

export function CmmsEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: CmmsEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 py-10 text-center",
        className,
      )}
      role="status"
    >
      {icon ? <div className="mb-3 text-[var(--muted-foreground)]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <CmmsButton type="button" variant="secondary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </CmmsButton>
      ) : null}
    </div>
  );
}
