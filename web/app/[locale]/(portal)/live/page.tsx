"use client";

import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http } from "@/core/api/http";

export default function LivePage() {
  return (
    <ProtectedRoute>
      <LiveContent />
    </ProtectedRoute>
  );
}

function LiveContent() {
  const query = useQuery({
    queryKey: ["church", "broadcasts", "live"],
    queryFn: async () => {
      const res = await http.get("/church/broadcasts/live");
      return res.data.data as unknown[];
    },
  });
  const list = (query.data ?? []) as Array<{ title: string; youtubeUrl: string }>;

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Live</h1>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No live stream right now.</p>
      ) : (
        list.map((b, i) => (
          <CmmsCard key={i} title={b.title}>
            <a
              href={b.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--primary)]"
            >
              Open livestream
            </a>
          </CmmsCard>
        ))
      )}
    </div>
  );
}
