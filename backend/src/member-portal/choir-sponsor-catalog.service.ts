import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ChoirSponsorCatalogService {
  constructor(private prisma: PrismaService) {}

  private async assertSponsorAccess(userId: string, choirId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Member profile required');

    const sponsorship = await this.prisma.choirSponsorship.findFirst({
      where: { memberId: member.id, choirId, active: true },
    });
    if (!sponsorship) {
      throw new ForbiddenException('Sponsor access required');
    }
    return member;
  }

  private mapListenLinks(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is { platform: string; url: string } =>
          typeof item === 'object' &&
          item != null &&
          typeof (item as { platform?: unknown }).platform === 'string' &&
          typeof (item as { url?: unknown }).url === 'string',
      )
      .map((item) => ({
        platform: item.platform,
        url: item.url,
      }));
  }

  async listSongs(
    userId: string,
    choirId: string,
    page = 1,
    limit = 50,
    search?: string,
  ) {
    await this.assertSponsorAccess(userId, choirId);
    const { skip, take } = paginate(page, limit);

    const filters: Prisma.SongWhereInput[] = [
      { active: true },
      { OR: [{ choirId }, { choirId: null }] },
    ];
    if (search?.trim()) {
      const q = search.trim();
      filters.push({
        OR: [
          { title: { contains: q } },
          { lyricist: { contains: q } },
          { composer: { contains: q } },
        ],
      });
    }

    const where: Prisma.SongWhereInput = { AND: filters };
    const [items, total] = await Promise.all([
      this.prisma.song.findMany({
        where,
        skip,
        take,
        orderBy: [{ releaseDate: 'desc' }, { title: 'asc' }],
        select: {
          id: true,
          title: true,
          lyricist: true,
          composer: true,
          releaseDate: true,
          listenLinksJson: true,
          genre: true,
        },
      }),
      this.prisma.song.count({ where }),
    ]);

    return paginatedResult(
      items.map((s) => ({
        id: s.id,
        title: s.title,
        lyricist: s.lyricist,
        composer: s.composer,
        releaseDate: s.releaseDate,
        genre: s.genre,
        listenLinks: this.mapListenLinks(s.listenLinksJson),
      })),
      total,
      page,
      limit,
    );
  }

  async getSong(userId: string, choirId: string, songId: string) {
    await this.assertSponsorAccess(userId, choirId);

    const song = await this.prisma.song.findFirst({
      where: {
        id: songId,
        active: true,
        OR: [{ choirId }, { choirId: null }],
      },
      include: { category: true },
    });
    if (!song) throw new NotFoundException('Song not found');

    return {
      id: song.id,
      title: song.title,
      alternateTitle: song.alternateTitle,
      language: song.language,
      lyricist: song.lyricist,
      composer: song.composer,
      arranger: song.arranger,
      conductedBy: song.conductedBy,
      producedBy: song.producedBy,
      performedBy: song.performedBy,
      genre: song.genre,
      voiceParts: song.voiceParts,
      durationSeconds: song.durationSeconds,
      releaseDate: song.releaseDate,
      year: song.year,
      shortSummary: song.shortSummary,
      fullDescription: song.fullDescription,
      recordingStudio: song.recordingStudio,
      mixingEngineer: song.mixingEngineer,
      masteringBy: song.masteringBy,
      recordingType: song.recordingType,
      copyrightInfo: song.copyrightInfo,
      scriptureReference: song.scriptureReference,
      category: song.category?.name ?? null,
      listenLinks: this.mapListenLinks(song.listenLinksJson),
    };
  }
}
