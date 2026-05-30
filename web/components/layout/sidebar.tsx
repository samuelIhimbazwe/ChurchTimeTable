"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/core/utils/cn";
import type { ShellNavGroup } from "@/components/layout/navigation";

export function Sidebar({
  groups,
  activePath,
  className,
  onNavigate,
}: Readonly<{
  groups: ShellNavGroup[];
  activePath: string;
  className?: string;
  onNavigate?: () => void;
}>) {
  const t = useTranslations();

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-xs flex-col rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)] lg:max-w-[280px]",
        className,
      )}
    >
      <div className="border-b border-[var(--border)] px-2 pb-4">
        <p className="cmms-text-label uppercase tracking-[0.16em] text-[var(--primary)]">
          {t("app.name")}
        </p>
        <p className="cmms-text-caption mt-2 text-[var(--muted-foreground)]">
          {t("app.tagline")}
        </p>
      </div>
      <nav className="mt-5 flex-1 space-y-6 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="cmms-text-label mb-2 px-2 text-[var(--muted-foreground)]">
              {t(group.labelKey)}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  activePath === item.href ||
                  (item.href !== "/dashboard" && activePath.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "cmms-interactive block rounded-[var(--radius-xl)] px-3 py-2.5",
                        active
                          ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-0.5 hidden text-xs leading-5 text-[var(--muted-foreground)] xl:block">
                        {item.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
