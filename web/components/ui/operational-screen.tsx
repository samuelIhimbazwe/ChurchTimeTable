"use client";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsTabs, type CmmsTabItem } from "@/components/ui/cmms-tabs";
import { cn } from "@/core/utils/cn";

export function OperationalScreen({
  title,
  subtitle,
  tabs,
  activeTabId,
  onTabChange,
  error,
  success,
  children,
  className,
}: Readonly<{
  title?: string;
  subtitle?: string;
  tabs?: CmmsTabItem[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("cmms-page-stack", className)}>
      {title ? (
        <header className="space-y-1">
          <h1 className="cmms-text-display text-[var(--foreground)]">{title}</h1>
          {subtitle ? (
            <p className="cmms-text-body max-w-2xl text-[var(--muted-foreground)]">{subtitle}</p>
          ) : null}
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
