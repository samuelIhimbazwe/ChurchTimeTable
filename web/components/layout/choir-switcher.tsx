"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { fetchUserChoirs } from "@/core/api/http";
import {
  useChoirContextStore,
  type ChoirOption,
} from "@/core/auth/choir-context-store";
import { CmmsButton } from "@/components/ui/cmms-button";

export function ChoirSwitcher() {
  const t = useTranslations("choir");
  const activeChoirId = useChoirContextStore((s) => s.activeChoirId);
  const choirs = useChoirContextStore((s) => s.choirs);
  const setActiveChoirId = useChoirContextStore((s) => s.setActiveChoirId);
  const setChoirs = useChoirContextStore((s) => s.setChoirs);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetchUserChoirs().then((rows) => {
      setChoirs(rows);
      if (rows.length > 0 && !rows.some((c) => c.id === activeChoirId)) {
        setActiveChoirId(rows[0].id);
      }
    });
  }, [activeChoirId, setActiveChoirId, setChoirs]);

  const active = choirs.find((c) => c.id === activeChoirId);

  if (choirs.length <= 1 && !active) {
    return null;
  }

  return (
    <div className="relative">
      <CmmsButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {active?.name ?? t("switcherLabel")}
      </CmmsButton>
      {open ? (
        <ul
          className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-md)]"
          role="listbox"
        >
          {choirs.map((choir: ChoirOption) => (
            <li key={choir.id}>
              <button
                type="button"
                role="option"
                aria-selected={choir.id === activeChoirId}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                onClick={() => {
                  setActiveChoirId(choir.id);
                  setOpen(false);
                }}
              >
                {choir.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
