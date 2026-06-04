import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasChoirOpsView } from './choir-scheduling-access.util';

@Injectable()
export class ChoirSearchService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async search(actorUserId: string, q: string, limit = 10) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasChoirOpsView(resolved.permissions)) {
      return { activities: [], plans: [], rankings: [], badges: [] };
    }
    const query = q.trim();
    if (!query) {
      return { activities: [], plans: [], rankings: [], badges: [] };
    }

    const [activities, plans, rankings, badges] = await Promise.all([
      this.prisma.choirActivity.findMany({
        where: { title: { contains: query } },
        take: limit,
        select: { id: true, title: true, activityType: true, startAt: true },
      }),
      this.prisma.choirSchedulePlan.findMany({
        where: { label: { contains: query } },
        take: limit,
        select: { id: true, label: true, periodType: true, year: true },
      }),
      this.prisma.choirCategoryRankingEntry.findMany({
        where: {
          member: {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
            ],
          },
        },
        take: limit,
        select: { id: true, category: true, rank: true, year: true, memberId: true },
      }),
      this.prisma.choirMemberBadge.findMany({
        take: limit,
        select: { id: true, kind: true, profileId: true },
      }),
    ]);

    return { activities, plans, rankings, badges };
  }
}
