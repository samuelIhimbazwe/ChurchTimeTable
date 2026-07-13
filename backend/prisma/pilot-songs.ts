import type { PrismaClient } from '@prisma/client';

/** Stable pilot catalog ids — do not delete during junk cleanup. */
export const PILOT_SONG_IDS = [
  'pilot-song-ijwi-ry-umwami',
  'pilot-song-turagusingiza',
  'pilot-song-ni-wewe-mana',
  'pilot-song-coming-soon',
] as const;

/** Remove songs created by e2e runs (timestamp titles, generic placeholders). */
export async function cleanupE2eMusicJunk(prisma: PrismaClient): Promise<number> {
  const junk = await prisma.song.findMany({
    where: {
      id: { notIn: [...PILOT_SONG_IDS] },
      OR: [
        { title: { startsWith: 'Launch Song ' } },
        { title: 'Rehearsal Song' },
        { title: { startsWith: '[e2e] ' } },
      ],
    },
    select: { id: true },
  });
  if (junk.length === 0) return 0;

  const ids = junk.map((s) => s.id);
  await prisma.rehearsalPlanSong.deleteMany({ where: { songId: { in: ids } } });
  await prisma.songUsageRecord.deleteMany({ where: { songId: { in: ids } } });
  await prisma.songFavorite.deleteMany({ where: { songId: { in: ids } } });
  await prisma.songAsset.deleteMany({ where: { songId: { in: ids } } });
  await prisma.servicePreparationItem.updateMany({
    where: { songId: { in: ids } },
    data: { songId: null },
  });
  await prisma.song.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

type SeedPilotSongsInput = {
  choirId: string;
  categoryId: string;
  /** When false, only upserts metadata (seed.ts). When true, includes rich assets (seed-pilot.ts). */
  withAssets?: boolean;
};

export async function seedPilotSongCatalog(
  prisma: PrismaClient,
  { choirId, categoryId, withAssets = false }: SeedPilotSongsInput,
): Promise<void> {
  await cleanupE2eMusicJunk(prisma);

  const ijwiLyrics = `Ijwi ry'Umwami riravuga\nKo Yesu ari Umwami wacu\nTuri abana b'Ubwami\nDuhimbaze izina rye\n\nIjwi ry'Umwami riravuga\nKo twizere mu mutima\nTuri abasangirwa na We\nDuhimbaze Umwami wacu`;

  await prisma.song.upsert({
    where: { id: 'pilot-song-ijwi-ry-umwami' },
    create: {
      id: 'pilot-song-ijwi-ry-umwami',
      choirId,
      title: "Ijwi ry'Umwami",
      lyricist: 'Pastor Emmanuel N.',
      composer: 'ADEPR Choir Collective',
      conductedBy: withAssets ? 'David Hoza' : undefined,
      producedBy: withAssets ? 'Kigali Sound Studio' : undefined,
      performedBy: withAssets ? "Ijwi ry'Umwami Choir" : undefined,
      genre: withAssets ? 'Gospel / Worship' : undefined,
      voiceParts: 'SATB',
      durationSeconds: withAssets ? 312 : undefined,
      releaseDate: withAssets ? new Date('2024-11-15') : undefined,
      shortSummary: withAssets
        ? 'A celebration of Christ as King — recorded live at the annual choir concert.'
        : undefined,
      fullDescription: withAssets
        ? 'Written for the 2024 concert season, this anthem blends traditional hymnody with contemporary Rwandan harmonies.'
        : undefined,
      recordingStudio: withAssets ? 'Kigali Sound Studio' : undefined,
      mixingEngineer: withAssets ? 'Eric Mugisha' : undefined,
      masteringBy: withAssets ? 'Studio Master RW' : undefined,
      recordingType: withAssets ? 'Live concert' : undefined,
      listenLinksJson: withAssets
        ? [
            { platform: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { platform: 'Spotify', url: 'https://open.spotify.com/track/example' },
          ]
        : undefined,
      categoryId,
      language: 'rw',
      lyricsText: ijwiLyrics,
      notes: 'Practice SATB — sopranos carry the melody in verse 1.',
      active: true,
    },
    update: {
      choirId,
      title: "Ijwi ry'Umwami",
      categoryId,
      lyricsText: ijwiLyrics,
      active: true,
    },
  });

  const turagusingizaLyrics = `Turagusingiza, turagusingiza\nYesu Umwami wacu\nTuraguhimbaza\nUmutima wacu wuzuye ibyishimo`;

  await prisma.song.upsert({
    where: { id: 'pilot-song-turagusingiza' },
    create: {
      id: 'pilot-song-turagusingiza',
      choirId,
      title: 'Turagusingiza',
      lyricist: 'Traditional / Choir adaptation',
      composer: 'ADEPR Worship Team',
      genre: 'Praise & Worship',
      voiceParts: 'SATB',
      durationSeconds: 245,
      releaseDate: new Date('2023-06-01'),
      shortSummary: 'Up-tempo praise anthem — Sunday service opener.',
      categoryId,
      language: 'rw',
      lyricsText: turagusingizaLyrics,
      notes: 'Start with unison on verse 1; parts from chorus.',
      active: true,
    },
    update: {
      choirId,
      title: 'Turagusingiza',
      categoryId,
      lyricsText: turagusingizaLyrics,
      active: true,
    },
  });

  const niWeweLyrics = `Ni Wewe Mana yanjye\nUmutima wanjye uraguhimbaza\nUrukundo rwawe ruruta ibindi byose\nNkwegereza mu maso yawe`;

  await prisma.song.upsert({
    where: { id: 'pilot-song-ni-wewe-mana' },
    create: {
      id: 'pilot-song-ni-wewe-mana',
      choirId,
      title: 'Ni Wewe Mana',
      lyricist: 'Grace Mukamana',
      composer: 'Choir Arrangers Team',
      genre: 'Worship',
      voiceParts: 'SATB',
      durationSeconds: 278,
      shortSummary: 'Reflective worship piece for communion or altar call.',
      categoryId,
      language: 'rw',
      lyricsText: niWeweLyrics,
      active: true,
    },
    update: {
      choirId,
      title: 'Ni Wewe Mana',
      categoryId,
      lyricsText: niWeweLyrics,
      active: true,
    },
  });

  const comingSoonLyrics = `Urukundo rw'Imana ruruta ibyo dushaka\nRutugeraho amahoro\nTegereza gutangazwa mu mpera z'uyu mwaka`;

  await prisma.song.upsert({
    where: { id: 'pilot-song-coming-soon' },
    create: {
      id: 'pilot-song-coming-soon',
      choirId,
      title: "Urukundo rw'Imana (Coming soon)",
      lyricist: 'Grace M.',
      composer: 'Choir Arrangers Team',
      genre: 'Worship',
      shortSummary: 'New single in production — sponsors will be the first to hear it.',
      listenLinksJson: [],
      categoryId,
      language: 'rw',
      lyricsText: comingSoonLyrics,
      active: true,
    },
    update: {
      choirId,
      title: "Urukundo rw'Imana (Coming soon)",
      categoryId,
      lyricsText: comingSoonLyrics,
      active: true,
    },
  });

  if (!withAssets) {
    await prisma.songAsset.deleteMany({
      where: { songId: 'pilot-song-ijwi-ry-umwami' },
    });
    await prisma.songAsset.createMany({
      data: [
        {
          songId: 'pilot-song-ijwi-ry-umwami',
          assetType: 'PDF',
          fileName: "Ijwi ry'Umwami — SATB score.pdf",
          fileUrl:
            'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        },
        {
          songId: 'pilot-song-ijwi-ry-umwami',
          assetType: 'AUDIO',
          fileName: "Ijwi ry'Umwami — practice track.mp3",
          fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          mimeType: 'audio/mpeg',
        },
      ],
    });
    return;
  }

  await prisma.songAsset.deleteMany({
    where: { songId: 'pilot-song-ijwi-ry-umwami' },
  });
  await prisma.songAsset.createMany({
    data: [
      {
        songId: 'pilot-song-ijwi-ry-umwami',
        assetType: 'PDF',
        fileName: "Ijwi ry'Umwami — SATB score.pdf",
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        mimeType: 'application/pdf',
      },
      {
        songId: 'pilot-song-ijwi-ry-umwami',
        assetType: 'AUDIO',
        fileName: "Ijwi ry'Umwami — practice track.mp3",
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
      },
    ],
  });
}
