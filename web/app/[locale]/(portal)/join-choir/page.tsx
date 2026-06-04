"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http, getApiErrorMessage } from "@/core/api/http";
import { usePublicChoirs } from "@/features/member-portal/hooks/use-member-portal";

export default function JoinChoirPage() {
  return (
    <ProtectedRoute>
      <JoinChoirContent />
    </ProtectedRoute>
  );
}

function JoinChoirContent() {
  const choirs = usePublicChoirs();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestJoin(choirId: string) {
    setLoading(true);
    setMessage(null);
    try {
      await http.post("/choirs/join-requests", {
        choirId,
        requestType: "PERMANENT_MEMBER",
      });
      setMessage("Request submitted.");
      void choirs.refetch();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const list = (choirs.data ?? []) as Array<{
    id: string;
    name: string;
    description?: string;
    leader?: string;
    membershipCount: number;
    joinStatus?: string | null;
  }>;

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Join a choir</h1>
      {message ? <p className="text-sm">{message}</p> : null}
      {list.map((c) => (
        <CmmsCard key={c.id} title={c.name}>
          <p className="text-sm text-[var(--muted-foreground)]">{c.description}</p>
          <p className="mt-2 text-sm">Members: {c.membershipCount}</p>
          {c.joinStatus ? (
            <p className="text-sm">Status: {c.joinStatus}</p>
          ) : (
            <button
              type="button"
              disabled={loading}
              className="mt-3 text-sm font-medium text-[var(--primary)]"
              onClick={() => requestJoin(c.id)}
            >
              Request to join
            </button>
          )}
        </CmmsCard>
      ))}
    </div>
  );
}
