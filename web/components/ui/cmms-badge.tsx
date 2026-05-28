import { cn } from "@/core/utils/cn";

const variantStyles = {
  neutral:
    "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
} as const;

export function CmmsBadge({
  children,
  className,
  variant = "neutral",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variantStyles;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold whitespace-normal",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
