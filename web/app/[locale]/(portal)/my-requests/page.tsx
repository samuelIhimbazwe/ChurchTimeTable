"use client";

import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http } from "@/core/api/http";

export default function MyRequestsPage() {
  return (
    <ProtectedRoute>
      <MyRequestsContent />
    </ProtectedRoute>
  );
}

function MyRequestsContent() {
  const query = useQuery({
    queryKey: ["choirs", "join-requests"],
    queryFn: async () => {
      const res = await http.get("/choirs/join-requests");
      return res.data.data as unknown[];
    },
  });
  const list = (query.data ?? []) as Array<{
    id: string;
    status: string;
    choir: { name: string };
  }>;

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">My choir requests</h1>
      {list.map((r) => (
        <CmmsCard key={r.id} title={r.choir.name}>
          <p className="text-sm">Status: {r.status}</p>
        </CmmsCard>
      ))}
    </div>
  );
}
