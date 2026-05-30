import { cn } from "@/core/utils/cn";

export function CmmsSkeleton({
  className,
}: Readonly<{
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-muted)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function CmmsCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)]">
      <CmmsSkeleton className="h-5 w-40" />
      <CmmsSkeleton className="mt-3 h-4 w-full max-w-sm" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CmmsSkeleton className="h-20" />
        <CmmsSkeleton className="h-20" />
      </div>
    </div>
  );
}

export function CmmsDashboardSkeleton() {
  return (
    <div className="cmms-page-stack">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CmmsSkeleton key={i} className="h-28" />
        ))}
      </div>
      <CmmsCardSkeleton />
      <CmmsCardSkeleton />
    </div>
  );
}
