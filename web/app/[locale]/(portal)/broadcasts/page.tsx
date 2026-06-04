"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { useChurchBroadcasts } from "@/features/member-portal/hooks/use-member-portal";

export default function BroadcastsPage() {
  return (
    <ProtectedRoute>
      <BroadcastsContent />
    </ProtectedRoute>
  );
}

function BroadcastsContent() {
  const query = useChurchBroadcasts();
  const list = (query.data ?? []) as Array<{
    id: string;
    title: string;
    youtubeUrl: string;
    broadcastType: string;
    isLive: boolean;
  }>;

  return (
    <div className="mx-auto max-w-3xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Broadcast center</h1>
      {list.map((b) => (
        <CmmsCard key={b.id} title={b.title}>
          <p className="text-sm">{b.broadcastType}</p>
          <a
            href={b.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-[var(--primary)]"
          >
            Watch on YouTube
          </a>
        </CmmsCard>
      ))}
    </div>
  );
}
