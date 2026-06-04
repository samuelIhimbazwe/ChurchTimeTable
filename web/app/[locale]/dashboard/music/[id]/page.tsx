import { ProtectedRoute } from "@/components/auth/protected-route";
import { MusicSongDetail } from "@/features/music/components/music-song-detail";

export default async function MusicSongDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  return (
    <ProtectedRoute
      requiredPermissions={["choir.music.view", "choir.music.manage"]}
    >
      <MusicSongDetail songId={id} />
    </ProtectedRoute>
  );
}
