"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { useMembershipCenter } from "@/features/member-portal/hooks/use-member-portal";
import { Link } from "@/i18n/routing";

export default function MembershipPage() {
  return (
    <ProtectedRoute>
      <MembershipContent />
    </ProtectedRoute>
  );
}

function MembershipContent() {
  const query = useMembershipCenter();
  const data = query.data as {
    choirs?: Array<{ choir: { name: string } }>;
    joinRequests?: Array<{ status: string; choir: { name: string } }>;
    protocolInvitations?: Array<{ status: string }>;
    isProtocolMember?: boolean;
  } | undefined;

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Membership center</h1>
      <CmmsCard title="My choirs">
        <ul className="text-sm">
          {(data?.choirs ?? []).map((c, i) => (
            <li key={i}>{c.choir.name}</li>
          ))}
        </ul>
      </CmmsCard>
      <CmmsCard title="Protocol">
        <p className="text-sm">
          Status: {data?.isProtocolMember ? "Active member" : "Not a member"}
        </p>
        <Link href="/join-protocol" className="mt-2 inline-block text-sm text-[var(--primary)]">
          Protocol options
        </Link>
      </CmmsCard>
      <CmmsCard title="Pending requests">
        <ul className="text-sm">
          {(data?.joinRequests ?? []).map((r, i) => (
            <li key={i}>
              {r.choir.name} — {r.status}
            </li>
          ))}
        </ul>
      </CmmsCard>
    </div>
  );
}
