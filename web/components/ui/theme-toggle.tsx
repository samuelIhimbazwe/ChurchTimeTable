"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="inline-flex flex-wrap rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] p-1 text-sm shadow-[var(--shadow-xs)]">
      {[
        { value: "light", label: t("light") },
        { value: "dark", label: t("dark") },
        { value: "system", label: t("system") },
      ].map((option) => {
        const active =
          option.value === "system" ? theme === "system" : theme === option.value;
        const tone =
          option.value === "system"
            ? resolvedTheme === "dark"
              ? t("dark")
              : t("light")
            : option.label;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={option.label}
            title={tone}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 transition ${
              active
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
