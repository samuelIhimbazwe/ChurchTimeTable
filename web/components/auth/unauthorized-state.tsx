"use client";

import { useTranslations } from "next-intl";

export function UnauthorizedState({
  title,
  description,
}: Readonly<{
  title?: string;
  description?: string;
}>) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="max-w-md rounded-[var(--radius-2xl)] border border-amber-200 bg-amber-50 p-6 text-center shadow-[var(--shadow-xs)] dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
          {title ?? t("unauthorized")}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
