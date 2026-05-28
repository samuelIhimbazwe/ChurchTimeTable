import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: { entity?: string; entityId?: string },
  ) {
    const { skip, take } = paginate(page, limit);
    const where: Prisma.AuditLogWhereInput = {};
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.entityId) where.entityId = filters.entityId;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginatedResult(items, total, page, limit);
  }
}
