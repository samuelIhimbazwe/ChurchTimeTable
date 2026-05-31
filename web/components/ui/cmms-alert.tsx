import { cn } from "@/core/utils/cn";

const variants = {
  error:
    "border border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger-foreground)]",
  success:
    "border border-[var(--success)]/20 bg-[var(--success-surface)] text-[var(--success-foreground)]",
  warning:
    "border border-[var(--warning)]/20 bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
  info: "border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)]",
} as const;

export function CmmsAlert({
  variant = "info",
  children,
  className,
}: Readonly<{
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "cmms-text-body rounded-[var(--radius-xl)] px-4 py-3",
        variants[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
