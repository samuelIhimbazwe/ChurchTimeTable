import { cn } from "@/core/utils/cn";

export function CmmsFormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: Readonly<{
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="cmms-text-label block text-[var(--foreground)]">
        {label}
        {required ? <span className="text-[var(--primary)]"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="cmms-text-caption text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
