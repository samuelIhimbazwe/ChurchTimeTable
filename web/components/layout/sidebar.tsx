"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/core/utils/cn";
import type { ShellNavGroup } from "@/components/layout/navigation";
import { NavIcon, navIconForHref } from "@/components/layout/nav-icons";

export function Sidebar({
  groups,
  activePath,
  className,
  onNavigate,
  userName,
  userRole,
}: Readonly<{
  groups: ShellNavGroup[];
  activePath: string;
  className?: string;
  onNavigate?: () => void;
  userName?: string;
  userRole?: string;
}>) {
  const t = useTranslations();
  const initials = (userName?.[0] ?? "C").toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-xs flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] lg:max-w-[260px]",
        className,
      )}
    >
      <div className="border-b border-[var(--border)] px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-muted)] text-[var(--primary)]">
            <NavIcon name="governance" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              {t("app.nameShort")}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {t("app.taglineShort")}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.id}>
            {group.labelKey ? (
              <p className="cmms-text-label mb-2 px-2 text-[var(--muted-foreground)]">
                {t(group.labelKey)}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  activePath === item.href ||
                  (item.href !== "/dashboard" && activePath.startsWith(item.href));
                const icon = navIconForHref(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "cmms-interactive flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium",
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xs)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <NavIcon name={icon} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {userName ? (
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{userName}</p>
              {userRole ? (
                <p className="truncate text-xs text-[var(--muted-foreground)]">{userRole}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
