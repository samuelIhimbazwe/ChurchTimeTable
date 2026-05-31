"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/core/utils/cn";

export function CmmsInput({
  label,
  hint,
  error,
  className,
  inputClassName,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string | null;
  inputClassName?: string;
}) {
  const inputId = id ?? props.name ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const input = (
    <input
      id={inputId}
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20",
        error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20",
        inputClassName,
      )}
      {...props}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <label className={cn("flex min-w-0 flex-col gap-2", className)} htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {input}
      {error ? (
        <span className="text-sm text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-sm text-[var(--muted-foreground)]">{hint}</span>
      ) : null}
    </label>
  );
}
