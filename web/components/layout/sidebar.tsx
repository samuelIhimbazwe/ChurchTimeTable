"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/core/utils/cn";
import type { ShellNavItem } from "@/components/layout/navigation";

export function Sidebar({
  items,
  activePath,
  className,
  onNavigate,
}: Readonly<{
  items: ShellNavItem[];
  activePath: string;
  className?: string;
  onNavigate?: () => void;
}>) {
  const t = useTranslations();

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-xs flex-col rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="border-b border-[var(--border)] px-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          {t("app.name")}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {t("app.tagline")}
        </p>
      </div>
      <nav className="mt-4 flex-1 space-y-2">
        {items.map((item) => {
          const active = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block rounded-[var(--radius-xl)] px-4 py-3 transition",
                active
                  ? "bg-[var(--surface-muted)] text-[var(--foreground)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
              )}
            >
              <span className="block font-medium break-words">{item.label}</span>
              <span className="mt-1 block text-sm leading-6 break-words opacity-80">
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
