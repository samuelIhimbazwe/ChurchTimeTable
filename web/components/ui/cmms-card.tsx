import { cn } from "@/core/utils/cn";

export function CmmsCard({
  title,
  description,
  headerAction,
  children,
  className,
  contentClassName,
}: Readonly<{
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] break-words">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-[var(--muted-foreground)] break-words">
              {description}
            </p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className={cn("mt-5 min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}
