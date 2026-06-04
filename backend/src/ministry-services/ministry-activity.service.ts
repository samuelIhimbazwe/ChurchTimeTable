import { Injectable } from '@nestjs/common';
import { MinistryActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import {
  assertMinistryServicesAccess,
} from './ministry-services.util';

@Injectable()
export class MinistryActivityService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
  ) {}

  async record(params: {
    ministryId: string;
    type: MinistryActivityType;
    actorUserId?: string;
    actorLabel?: string;
    entityType?: string;
    entityId?: string;
    summary?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.ministryActivity.create({ data: params });
  }

  async list(
    actorUserId: string,
    ministryId: string,
    filters?: { type?: MinistryActivityType; from?: string; to?: string },
  ) {
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);

    const where: Prisma.MinistryActivityWhereInput = { ministryId };
    if (filters?.type) where.type = filters.type;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return this.prisma.ministryActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { id: true, email: true } } },
    });
  }
}
