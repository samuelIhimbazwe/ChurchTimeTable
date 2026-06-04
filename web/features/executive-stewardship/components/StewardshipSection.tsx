"use client";

import { CmmsCard } from "@/components/ui/cmms-card";
import { Link } from "@/i18n/routing";

export function StewardshipSection({
  title,
  viewAllHref,
  viewAllLabel,
  children,
}: Readonly<{
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}>) {
  return (
    <CmmsCard
      title={title}
      headerAction={
        viewAllHref && viewAllLabel ? (
          <Link href={viewAllHref} className="text-sm font-medium text-[var(--primary)]">
            {viewAllLabel}
          </Link>
        ) : undefined
      }
    >
      {children}
    </CmmsCard>
  );
}
