"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/core/utils/cn";

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}>) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex min-w-0 flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            "min-h-11 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-24 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20",
            error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20",
          )}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-3 my-auto rounded-[var(--radius-pill)] px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
        >
          {visible ? t("hidePassword") : t("showPassword")}
        </button>
      </div>
      {error ? (
        <span className="text-sm text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-sm text-[var(--muted-foreground)]">{hint}</span>
      ) : null}
    </label>
  );
}
