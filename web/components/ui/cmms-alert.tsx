import { cn } from "@/core/utils/cn";

const variants = {
  error:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  info: "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)]",
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
        "cmms-text-body rounded-[var(--radius-xl)] border px-4 py-3",
        variants[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
