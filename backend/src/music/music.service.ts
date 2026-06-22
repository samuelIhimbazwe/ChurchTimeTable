import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirMusicAccessService } from './choir-music-access.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { CreateSongAssetDto } from './dto/create-song-asset.dto';

@Injectable()
export class MusicService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private musicAccess: ChoirMusicAccessService,
  ) {}

  private async assertAccess(userId: string, choirId?: string, manage = false) {
    if (manage) {
      await this.musicAccess.requireManageMusic(userId, choirId);
    } else {
      await this.musicAccess.requireViewMusic(userId, choirId);
    }
  }

  private async memberIdForUser(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Member profile required');
    return member.id;
  }

  async listSongs(
    userId: string,
    page = 1,
    limit = 20,
    search?: string,
    categoryId?: string,
    language?: string,
    choirId?: string,
  ) {
    await this.assertAccess(userId, choirId);
    const { skip, take } = paginate(page, limit);
    const filters: Prisma.SongWhereInput[] = [{ active: true }];
    if (choirId) {
      filters.push({ OR: [{ choirId }, { choirId: null }] });
    }
    if (search?.trim()) {
      const q = search.trim();
      filters.push({
        OR: [
          { title: { contains: q } },
          { alternateTitle: { contains: q } },
          { composer: { contains: q } },
          { lyricist: { contains: q } },
          { lyricsText: { contains: q } },
        ],
      });
    }
    if (categoryId) filters.push({ categoryId });
    if (language) filters.push({ language });

    const where: Prisma.SongWhereInput = { AND: filters };
    const [items, total] = await Promise.all([
      this.prisma.song.findMany({
        where,
        skip,
        take,
        orderBy: { title: 'asc' },
        include: {
          category: true,
          assets: { select: { assetType: true } },
          _count: { select: { usageRecords: true, assets: true, favorites: true } },
        },
      }),
      this.prisma.song.count({ where }),
    ]);
    return paginatedResult(
      items.map((s) => this.serializeListSong(s)),
      total,
      page,
      limit,
    );
  }

  private serializeListSong(
    s: Prisma.SongGetPayload<{
      include: {
        category: true;
        assets: { select: { assetType: true } };
        _count: { select: { usageRecords: true; assets: true; favorites: true } };
      };
    }>,
  ) {
    const scoreTypes = new Set(['PDF', 'SHEET_MUSIC']);
    const hasScore = s.assets.some((a) => scoreTypes.has(a.assetType));
    const hasAudio = s.assets.some((a) => a.assetType === 'AUDIO');
    const hasVideo = s.assets.some((a) => a.assetType === 'VIDEO');
    return {
      id: s.id,
      title: s.title,
      alternateTitle: s.alternateTitle,
      language: s.language,
      lyricist: s.lyricist,
      composer: s.composer,
      voiceParts: s.voiceParts,
      category: s.category?.name ?? null,
      categoryId: s.categoryId,
      hasLyrics: Boolean(s.lyricsText?.trim()),
      hasScore,
      hasAudio,
      hasVideo,
      usageCount: s._count.usageRecords,
      assetCount: s._count.assets,
      favoriteCount: s._count.favorites,
      createdAt: s.createdAt,
    };
  }

  async getSong(userId: string, id: string) {
    await this.assertAccess(userId);
    let isFavorite = false;
    try {
      const memberId = await this.memberIdForUser(userId);
      const favorite = await this.prisma.songFavorite.findUnique({
        where: { memberId_songId: { memberId, songId: id } },
      });
      isFavorite = Boolean(favorite);
    } catch {
      isFavorite = false;
    }

    const song = await this.prisma.song.findUnique({
      where: { id },
      include: {
        category: true,
        assets: { orderBy: { createdAt: 'desc' } },
        usageRecords: {
          orderBy: { usedAt: 'desc' },
          take: 20,
          include: {
            leader: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!song) throw new NotFoundException('Not found');
    const lastUsed = song.usageRecords[0]?.usedAt ?? null;
    return {
      id: song.id,
      title: song.title,
      alternateTitle: song.alternateTitle,
      language: song.language,
      lyricist: song.lyricist,
      composer: song.composer,
      arranger: song.arranger,
      voiceParts: song.voiceParts,
      scriptureReference: song.scriptureReference,
      notes: song.notes,
      category: song.category?.name ?? null,
      categoryId: song.categoryId,
      lyrics: song.lyricsText,
      lyricsText: song.lyricsText,
      assets: song.assets.map((a) => ({
        id: a.id,
        assetType: a.assetType,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        createdAt: a.createdAt,
      })),
      lastUsed,
      usageCount: song.usageRecords.length,
      isFavorite,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
    };
  }

  async createSong(userId: string, dto: CreateSongDto) {
    await this.assertAccess(userId, undefined, true);
    const row = await this.prisma.song.create({
      data: {
        title: dto.title.trim(),
        alternateTitle: dto.alternateTitle?.trim(),
        categoryId: dto.categoryId,
        language: dto.language,
        lyricist: dto.lyricist,
        composer: dto.composer,
        arranger: dto.arranger,
        conductedBy: dto.conductedBy,
        producedBy: dto.producedBy,
        performedBy: dto.performedBy,
        genre: dto.genre,
        voiceParts: dto.voiceParts,
        durationSeconds: dto.durationSeconds,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
        shortSummary: dto.shortSummary,
        fullDescription: dto.fullDescription,
        recordingStudio: dto.recordingStudio,
        mixingEngineer: dto.mixingEngineer,
        masteringBy: dto.masteringBy,
        recordingType: dto.recordingType,
        listenLinksJson: (dto.listenLinks ?? undefined) as Prisma.InputJsonValue | undefined,
        year: dto.year,
        copyrightInfo: dto.copyrightInfo,
        source: dto.source,
        scriptureReference: dto.scriptureReference,
        lyricsText: dto.lyricsText,
        notes: dto.notes,
        active: dto.active ?? true,
      },
    });
    await this.audit.log({
      userId,
      action: 'SONG_CREATED',
      entity: 'Song',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async updateSong(userId: string, id: string, dto: UpdateSongDto) {
    const existing = await this.prisma.song.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Not found');
    await this.assertAccess(userId, existing.choirId ?? undefined, true);
    const row = await this.prisma.song.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        alternateTitle: dto.alternateTitle?.trim(),
        categoryId: dto.categoryId,
        language: dto.language,
        lyricist: dto.lyricist,
        composer: dto.composer,
        arranger: dto.arranger,
        conductedBy: dto.conductedBy,
        producedBy: dto.producedBy,
        performedBy: dto.performedBy,
        genre: dto.genre,
        voiceParts: dto.voiceParts,
        durationSeconds: dto.durationSeconds,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
        shortSummary: dto.shortSummary,
        fullDescription: dto.fullDescription,
        recordingStudio: dto.recordingStudio,
        mixingEngineer: dto.mixingEngineer,
        masteringBy: dto.masteringBy,
        recordingType: dto.recordingType,
        listenLinksJson: dto.listenLinks as Prisma.InputJsonValue | undefined,
        year: dto.year,
        copyrightInfo: dto.copyrightInfo,
        source: dto.source,
        scriptureReference: dto.scriptureReference,
        lyricsText: dto.lyricsText,
        notes: dto.notes,
        active: dto.active,
      },
    });
    await this.audit.log({
      userId,
      action: dto.active === false ? 'SONG_ARCHIVED' : 'SONG_UPDATED',
      entity: 'Song',
      entityId: id,
      oldValue: existing,
      newValue: row,
    });
    return row;
  }

  async addAsset(userId: string, songId: string, dto: CreateSongAssetDto) {
    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song) throw new NotFoundException('Not found');
    await this.assertAccess(userId, song.choirId ?? undefined, true);
    const row = await this.prisma.songAsset.create({
      data: {
        songId,
        assetType: dto.assetType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
      },
    });
    await this.audit.log({
      userId,
      action: 'SONG_ASSET_ADDED',
      entity: 'SongAsset',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async toggleFavorite(userId: string, songId: string) {
    await this.assertAccess(userId);
    const memberId = await this.memberIdForUser(userId);
    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song?.active) throw new NotFoundException('Not found');

    const existing = await this.prisma.songFavorite.findUnique({
      where: { memberId_songId: { memberId, songId } },
    });
    if (existing) {
      await this.prisma.songFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.songFavorite.create({ data: { memberId, songId } });
    return { favorited: true };
  }

  async listFavorites(userId: string) {
    await this.assertAccess(userId);
    const memberId = await this.memberIdForUser(userId);
    const rows = await this.prisma.songFavorite.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      include: {
        song: { include: { category: true } },
      },
    });
    return rows.map((row) => row.song);
  }

  async analytics(userId: string) {
    await this.assertAccess(userId);
    const [totalSongs, recentSongs, usageGrouped, byCategory, byLanguage] =
      await Promise.all([
        this.prisma.song.count({ where: { active: true } }),
        this.prisma.song.findMany({
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, createdAt: true },
        }),
        this.prisma.songUsageRecord.groupBy({
          by: ['songId'],
          _count: { songId: true },
        }),
        this.prisma.song.groupBy({
          by: ['categoryId'],
          where: { active: true },
          _count: true,
        }),
        this.prisma.song.groupBy({
          by: ['language'],
          where: { active: true, language: { not: null } },
          _count: true,
        }),
      ]);

    const sortedUsage = [...usageGrouped].sort(
      (a, b) => b._count.songId - a._count.songId,
    );
    const topUsage = sortedUsage.slice(0, 10);
    const songIds = topUsage.map((row) => row.songId);
    const songs = await this.prisma.song.findMany({
      where: { id: { in: songIds } },
      select: { id: true, title: true },
    });
    const titleById = Object.fromEntries(songs.map((s) => [s.id, s.title]));

    return {
      totalSongs,
      recentSongs,
      mostUsed: topUsage.map((row) => ({
        songId: row.songId,
        title: titleById[row.songId] ?? row.songId,
        usageCount: row._count.songId,
      })),
      categoryDistribution: byCategory,
      languageDistribution: byLanguage,
    };
  }

  async listCategories() {
    return this.prisma.songCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
