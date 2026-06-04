"use client";

import { Link } from "@/i18n/routing";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { useMemberPortalDashboard } from "@/features/member-portal/hooks/use-member-portal";

export function ChurchMemberPortalDashboard() {
  const query = useMemberPortalDashboard();

  if (query.isLoading) return <CmmsDashboardSkeleton />;
  if (query.isError || !query.data) {
    return (
      <CmmsCard title="Member dashboard">
        <p className="text-sm text-[var(--muted-foreground)]">
          Unable to load member portal.
        </p>
      </CmmsCard>
    );
  }

  const data = query.data as {
    spiritual?: { verseOfDay?: { title?: string; verseText?: string } };
    activities?: { upcomingEvents?: Array<{ title: string }> };
    membership?: {
      myChoirs?: Array<{ choir: { name: string } }>;
      pendingJoinRequests?: unknown[];
      protocolInvitations?: unknown[];
    };
  };

  return (
    <div className="cmms-page-stack">
      <CmmsCard title="Spiritual">
        <p className="text-sm font-medium">
          {data.spiritual?.verseOfDay?.title ?? "Verse of the day"}
        </p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {data.spiritual?.verseOfDay?.verseText ?? "—"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/broadcasts" className="text-[var(--primary)] hover:underline">
            Broadcasts
          </Link>
          <Link href="/live" className="text-[var(--primary)] hover:underline">
            Live
          </Link>
        </div>
      </CmmsCard>

      <CmmsCard title="Activities">
        <ul className="space-y-2 text-sm">
          {(data.activities?.upcomingEvents ?? []).slice(0, 5).map((e, i) => (
            <li key={i}>{e.title}</li>
          ))}
        </ul>
      </CmmsCard>

      <CmmsCard title="Membership">
        <p className="text-sm">
          Choirs:{" "}
          {(data.membership?.myChoirs ?? [])
            .map((m) => m.choir.name)
            .join(", ") || "None"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/join-choir" className="text-[var(--primary)] hover:underline">
            Join a choir
          </Link>
          <Link href="/membership" className="text-[var(--primary)] hover:underline">
            Membership center
          </Link>
          <Link href="/my-requests" className="text-[var(--primary)] hover:underline">
            My requests
          </Link>
          <Link href="/my-invitations" className="text-[var(--primary)] hover:underline">
            Invitations
          </Link>
        </div>
      </CmmsCard>
    </div>
  );
}
