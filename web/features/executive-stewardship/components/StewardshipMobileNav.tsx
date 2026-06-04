"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/core/utils/cn";

const tabs = [
  { href: "/dashboard/stewardship", key: "overview" as const, exact: true },
  { href: "/dashboard/stewardship/campaigns", key: "campaigns" as const },
  { href: "/dashboard/stewardship/families", key: "families" as const },
  { href: "/dashboard/stewardship/contributors", key: "contributors" as const },
  { href: "/dashboard/stewardship/needs-attention", key: "more" as const },
];

export function StewardshipMobileNav() {
  const t = useTranslations("executiveStewardship.nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t("label")}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href || pathname.endsWith(tab.href)
            : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
