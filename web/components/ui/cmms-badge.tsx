import { cn } from "@/core/utils/cn";

const variantStyles = {
  neutral:
    "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
  success:
    "bg-[var(--success-surface)] text-[var(--success-foreground)]",
  warning:
    "bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
  danger:
    "bg-[var(--danger-surface)] text-[var(--danger-foreground)]",
  info: "bg-[var(--info-surface)] text-[var(--info-foreground)]",
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
