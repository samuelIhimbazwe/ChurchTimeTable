"use client";

import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http } from "@/core/api/http";

export default function MyInvitationsPage() {
  return (
    <ProtectedRoute>
      <MyInvitationsContent />
    </ProtectedRoute>
  );
}

function MyInvitationsContent() {
  const query = useQuery({
    queryKey: ["protocol", "invitations", "mine"],
    queryFn: async () => {
      const res = await http.get("/protocol/invitations/mine");
      return res.data.data as unknown[];
    },
  });
  const list = (query.data ?? []) as Array<{
    id: string;
    status: string;
    message?: string;
  }>;

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    await http.patch(`/protocol/invitations/${id}`, { status });
    void query.refetch();
  }

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Protocol invitations</h1>
      {list.map((inv) => (
        <CmmsCard key={inv.id} title={`Invitation — ${inv.status}`}>
          <p className="text-sm">{inv.message}</p>
          {inv.status === "PENDING" ? (
            <div className="mt-3 flex gap-4 text-sm">
              <button
                type="button"
                className="text-[var(--primary)]"
                onClick={() => respond(inv.id, "ACCEPTED")}
              >
                Accept
              </button>
              <button
                type="button"
                className="text-[var(--muted-foreground)]"
                onClick={() => respond(inv.id, "DECLINED")}
              >
                Decline
              </button>
            </div>
          ) : null}
        </CmmsCard>
      ))}
    </div>
  );
}
