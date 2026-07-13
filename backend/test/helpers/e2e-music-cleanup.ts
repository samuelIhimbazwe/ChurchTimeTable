import type { PrismaClient } from '@prisma/client';

/** Remove a song created during e2e tests (and dependent rows). */
export async function deleteE2eSong(prisma: PrismaClient, songId: string): Promise<void> {
  await prisma.rehearsalPlanSong.deleteMany({ where: { songId } });
  await prisma.songUsageRecord.deleteMany({ where: { songId } });
  await prisma.songFavorite.deleteMany({ where: { songId } });
  await prisma.songAsset.deleteMany({ where: { songId } });
  await prisma.servicePreparationItem.updateMany({
    where: { songId },
    data: { songId: null },
  });
  await prisma.song.delete({ where: { id: songId } }).catch(() => {});
}
