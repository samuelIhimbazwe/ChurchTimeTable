"use client";

import type { ReactNode } from "react";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsButton } from "@/components/ui/cmms-button";
import { Link } from "@/i18n/routing";

export function ActionCenterShell({
  id,
  title,
  subtitle,
  loading,
  error,
  loadingLabel,
  errorLabel,
  children,
  primaryAction,
  secondaryAction,
}: Readonly<{
  id: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  error?: boolean;
  loadingLabel: string;
  errorLabel: string;
  children?: ReactNode;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}>) {
  return (
    <CmmsCard
      title={title}
      description={subtitle}
      className="border-[var(--primary)]/20"
    >
      <section
        id={id}
        role="region"
        aria-labelledby={`${id}-title`}
        aria-busy={loading}
        className="space-y-4"
      >
        <h2 id={`${id}-title`} className="sr-only">
          {title}
        </h2>

        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">{loadingLabel}</p>
        ) : null}

        {error && !loading ? (
          <p className="text-sm text-[var(--destructive)]" role="alert">
            {errorLabel}
          </p>
        ) : null}

        {!loading && !error ? children : null}

        {(primaryAction || secondaryAction) && !loading ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {primaryAction ? (
              <Link href={primaryAction.href}>
                <CmmsButton type="button" size="sm">
                  {primaryAction.label}
                </CmmsButton>
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center text-sm text-[var(--primary)] hover:underline"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </CmmsCard>
  );
}
