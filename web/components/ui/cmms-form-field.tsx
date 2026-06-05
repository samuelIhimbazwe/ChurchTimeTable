import { cn } from "@/core/utils/cn";

export function CmmsFormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: Readonly<{
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="cmms-text-label block text-[var(--foreground)]"
      >
        {label}
        {required ? <span className="text-[var(--primary)]"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="cmms-text-caption text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
