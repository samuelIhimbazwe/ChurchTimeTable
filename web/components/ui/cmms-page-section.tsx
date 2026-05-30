import { cn } from "@/core/utils/cn";

export function CmmsPageSection({
  title,
  description,
  action,
  children,
  className,
}: Readonly<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn("cmms-section-stack", className)}>
      {title ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="cmms-text-heading text-[var(--foreground)]">{title}</h2>
            {description ? (
              <p className="cmms-text-body text-[var(--muted-foreground)]">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
