"use client";

import Link from "next/link";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsTabs, type CmmsTabItem } from "@/components/ui/cmms-tabs";
import { cn } from "@/core/utils/cn";

export function OperationalScreen({
  title,
  subtitle,
  description,
  tabs,
  activeTabId,
  onTabChange,
  error,
  success,
  actions,
  backHref,
  children,
  className,
}: Readonly<{
  title?: string;
  subtitle?: string;
  /** Alias for subtitle (legacy screens). */
  description?: string;
  tabs?: CmmsTabItem[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  error?: string | null;
  success?: string | null;
  actions?: React.ReactNode;
  backHref?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  const resolvedSubtitle = subtitle ?? description;
  return (
    <div className={cn("cmms-page-stack", className)}>
      {backHref ? (
        <Link href={backHref} className="text-sm text-[var(--primary)] hover:underline">
          ← Back
        </Link>
      ) : null}

      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? (
              <h1 className="cmms-text-display text-[var(--foreground)]">{title}</h1>
            ) : null}
            {resolvedSubtitle ? (
              <p className="cmms-text-body max-w-2xl text-[var(--muted-foreground)]">
                {resolvedSubtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}

      {tabs?.length && activeTabId && onTabChange ? (
        <CmmsTabs items={tabs} activeId={activeTabId} onChange={onTabChange} />
      ) : null}

      {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
      {success ? <CmmsAlert variant="success">{success}</CmmsAlert> : null}

      {children}
    </div>
  );
}
