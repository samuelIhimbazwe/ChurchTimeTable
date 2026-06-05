"use client";

import type { ReactNode } from "react";

import { ChurchBrandMark } from "@/components/branding/church-brand-mark";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function BrandedGuestAside({
  eyebrow,
  title,
  description,
  footer,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}>) {
  return (
    <section className="cmms-panel p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChurchBrandMark className="max-w-md" />
        <div className="flex flex-wrap gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </section>
  );
}
