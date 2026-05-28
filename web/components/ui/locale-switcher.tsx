"use client";

import { useLocale } from "next-intl";

import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();

  return (
    <label className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)]">
      <span className="font-medium">{locale.toUpperCase()}</span>
      <select
        aria-label="Select locale"
        className="min-w-[4rem] bg-transparent outline-none"
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as (typeof routing.locales)[number];
          const currentPath = window.location.pathname;
          const currentSearch = window.location.search;
          const pathWithoutLocale =
            currentPath.replace(/^\/(en|fr|rw)(?=\/|$)/, "") || "/";

          window.location.assign(`/${nextLocale}${pathWithoutLocale}${currentSearch}`);
        }}
      >
        {routing.locales.map((option) => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
