import { cn } from "@/core/utils/cn";
import { CmmsButton } from "@/components/ui/cmms-button";

export function CmmsEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: Readonly<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 py-12 text-center",
        className,
      )}
    >
      <p className="cmms-text-heading text-[var(--foreground)]">{title}</p>
      {description ? (
        <p className="cmms-text-body mt-2 max-w-md text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <CmmsButton type="button" variant="secondary" className="mt-5" onClick={onAction}>
          {actionLabel}
        </CmmsButton>
      ) : null}
    </div>
  );
}
