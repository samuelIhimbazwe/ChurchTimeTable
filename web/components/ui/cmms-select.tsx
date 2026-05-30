import { cn } from "@/core/utils/cn";

export function CmmsSelect({
  className,
  children,
  ...props
}: Readonly<React.SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <select
      className={cn(
        "cmms-interactive min-h-11 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/** Alias for design-system docs (modal pattern). */
export { CmmsModal as CmmsDialog } from "@/components/ui/cmms-modal";
