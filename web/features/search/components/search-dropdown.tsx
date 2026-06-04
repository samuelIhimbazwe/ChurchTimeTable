"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { fetchSearchSuggestions, type SearchResponse } from "@/core/api/http";
import {
  FINANCE_ACCESS_PERMISSIONS,
  canViewMusic,
  canViewRehearsals,
  canViewWelfare,
} from "@/core/auth/governance-permissions";
import { hasPermission } from "@/core/auth/rbac";
import type { AuthProfile } from "@/core/api/types";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/core/utils/cn";

const EMPTY_RESULTS: SearchResponse = {
  query: "",
  members: [],
  families: [],
  events: [],
  assignments: [],
  contributions: [],
  welfareCases: [],
  welfareCategories: [],
  songs: [],
  rehearsals: [],
  choirDocuments: [],
  choirMeetings: [],
  meetingDecisions: [],
  meetingActionItems: [],
  songCategories: [],
  welfareAssistance: [],
};

type SearchItem =
  | SearchResponse["members"][number]
  | SearchResponse["families"][number]
  | SearchResponse["events"][number]
  | SearchResponse["assignments"][number]
  | SearchResponse["contributions"][number]
  | SearchResponse["welfareCases"][number]
  | SearchResponse["songs"][number]
  | SearchResponse["rehearsals"][number]
  | SearchResponse["welfareCategories"][number]
  | SearchResponse["choirDocuments"][number]
  | SearchResponse["choirMeetings"][number]
  | SearchResponse["meetingDecisions"][number]
  | SearchResponse["meetingActionItems"][number]
  | SearchResponse["songCategories"][number]
  | SearchResponse["welfareAssistance"][number];

function searchHref(profile: AuthProfile | null, item: SearchItem): string | null {
  const permissions = profile?.permissions ?? [];
  switch (item.type) {
    case "member":
      return hasPermission(profile, ["member:manage"])
        ? "/dashboard/members"
        : null;
    case "family":
      return hasPermission(profile, ["family:view", "family:manage"])
        ? "/dashboard/families"
        : null;
    case "event":
      return hasPermission(profile, ["event:read"])
        ? "/dashboard/events"
        : null;
    case "assignment":
      return hasPermission(profile, ["event:read", "assignment:write"])
        ? "/dashboard/events"
        : null;
    case "contribution":
      return hasPermission(profile, [...FINANCE_ACCESS_PERMISSIONS])
        ? "/dashboard/finance"
        : null;
    case "welfareCase":
      return canViewWelfare(permissions)
        ? `/dashboard/welfare/${item.id}`
        : null;
    case "song":
      return canViewMusic(permissions) ? `/dashboard/music/${item.id}` : null;
    case "rehearsal":
      return canViewRehearsals(permissions)
        ? `/dashboard/rehearsals`
        : null;
    case "welfareCategory":
    case "welfareAssistance":
      return canViewWelfare(permissions) ? "/dashboard/welfare" : null;
    case "songCategory":
      return canViewMusic(permissions) ? "/dashboard/music" : null;
    case "meetingDecision":
    case "meetingActionItem":
      return hasPermission(profile, ["choir.meeting.manage", "choir.operations.manage"])
        ? "/dashboard/choir/meetings"
        : null;
    case "choirDocument":
      return hasPermission(profile, ["choir.document.manage", "choir.operations.manage"])
        ? "/dashboard/choir/documents"
        : null;
    case "choirMeeting":
      return hasPermission(profile, ["choir.meeting.manage", "choir.operations.manage"])
        ? "/dashboard/choir/meetings"
        : null;
    default:
      return null;
  }
}

function resultLabel(item: SearchItem): string {
  switch (item.type) {
    case "member":
      return item.memberNumber
        ? `${item.memberNumber} · ${item.displayName}`
        : item.displayName;
    case "family":
      return `${item.familyCode} · ${item.familyName}`;
    case "event":
    case "assignment":
    case "welfareCase":
    case "song":
    case "rehearsal":
    case "choirDocument":
    case "choirMeeting":
      return item.title;
    case "welfareCategory":
    case "songCategory":
      return item.name;
    case "meetingDecision":
      return item.decision;
    case "meetingActionItem":
    case "welfareAssistance":
      return "description" in item ? item.description : item.title;
    case "contribution":
      return item.referenceNumber;
    default:
      return "";
  }
}

export function SearchDropdown({
  profile,
  placeholder,
}: Readonly<{
  profile: AuthProfile;
  placeholder?: string;
}>) {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchSearchSuggestions(debouncedQuery)
      .then((payload) => {
        if (!cancelled) {
          setResults(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults(EMPTY_RESULTS);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const groups = useMemo(
    () =>
      [
        { key: "members", label: t("groups.members"), items: results.members },
        { key: "families", label: t("groups.families"), items: results.families },
        { key: "events", label: t("groups.events"), items: results.events },
        {
          key: "assignments",
          label: t("groups.assignments"),
          items: results.assignments,
        },
        {
          key: "contributions",
          label: t("groups.contributions"),
          items: results.contributions,
        },
        {
          key: "welfareCases",
          label: t("groups.welfareCases"),
          items: results.welfareCases,
        },
        { key: "songs", label: t("groups.songs"), items: results.songs },
        {
          key: "rehearsals",
          label: t("groups.rehearsals"),
          items: results.rehearsals,
        },
        {
          key: "welfareCategories",
          label: t("groups.welfareCategories"),
          items: results.welfareCategories,
        },
        {
          key: "choirDocuments",
          label: t("groups.choirDocuments"),
          items: results.choirDocuments,
        },
        {
          key: "choirMeetings",
          label: t("groups.choirMeetings"),
          items: results.choirMeetings,
        },
        {
          key: "meetingDecisions",
          label: t("groups.meetingDecisions"),
          items: results.meetingDecisions,
        },
        {
          key: "meetingActionItems",
          label: t("groups.meetingActionItems"),
          items: results.meetingActionItems,
        },
        {
          key: "songCategories",
          label: t("groups.songCategories"),
          items: results.songCategories,
        },
        {
          key: "welfareAssistance",
          label: t("groups.welfareAssistance"),
          items: results.welfareAssistance,
        },
      ].filter((group) => group.items.length > 0),
    [results, t],
  );

  const hasResults = groups.length > 0;
  const showPanel = open && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative min-w-[220px] flex-1">
      <label className="relative block">
        <span className="sr-only">{placeholder ?? t("placeholder")}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          placeholder={placeholder ?? t("placeholder")}
          className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
      </label>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          {loading ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
          ) : null}
          {!loading && !hasResults ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{t("empty")}</p>
          ) : null}
          {!loading
            ? groups.map((group) => (
                <div key={group.key} className="border-t border-[var(--border)] first:border-t-0">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map((item) => {
                      const href = searchHref(profile, item);
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
                              !href && "cursor-default opacity-70",
                            )}
                            onClick={() => {
                              if (!href) return;
                              setOpen(false);
                              setQuery("");
                              router.push(href);
                            }}
                          >
                            {resultLabel(item)}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
