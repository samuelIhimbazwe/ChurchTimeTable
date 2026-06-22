import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';

@Injectable()
export class ChoirSearchService {
  constructor(
    private prisma: PrismaService,
    private opsAccess: ChoirOpsAccessService,
  ) {}

  async search(actorUserId: string, q: string, limit = 10) {
    if (!(await this.opsAccess.canView(actorUserId))) {
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
