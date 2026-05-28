"use client";

import { useEffect } from "react";

import { cn } from "@/core/utils/cn";

export function CmmsModal({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  className,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-pill)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          >
            {closeLabel}
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
