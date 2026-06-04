import { Injectable } from '@nestjs/common';
import { AssetActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetActivityService {
  constructor(private prisma: PrismaService) {}

  async record(
    assetId: string,
    activityType: AssetActivityType,
    actorId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.assetActivity.create({
      data: { assetId, activityType, actorId, metadata },
    });
  }

  async timeline(assetId: string, filters?: { type?: AssetActivityType }) {
    return this.prisma.assetActivity.findMany({
      where: {
        assetId,
        ...(filters?.type ? { activityType: filters.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true } },
      },
    });
  }
}
