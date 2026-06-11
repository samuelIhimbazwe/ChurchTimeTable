import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type QuotaStatus = 'AVAILABLE' | 'LOW_PRIORITY';

@Injectable()
export class ServiceQuotaEngine {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.protocolEngineSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  async updateSettings(data: {
    maxOfficialServicesPerMonth?: number;
    maxNonChoirMembers?: number;
    backupPoolSize?: number;
    membersCanViewFullRanking?: boolean;
  }) {
    return this.prisma.protocolEngineSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
  }

  async countOfficialServicesInMonth(
    memberId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.protocolOccurrenceTeamMember.count({
      where: {
        memberId,
        assignmentType: 'OFFICIAL',
        isExtraService: false,
        team: {
          occurrence: { startAt: { gte: start, lte: end } },
          status: { in: ['APPROVED', 'PUBLISHED', 'COMPLETED'] },
        },
        attendance: {
          outcome: {
            in: [
              'PRESENT_FULL',
              'PRESENT_LATE',
              'PRESENT_LEFT_EARLY',
              'PRESENT_LATE_LEFT_EARLY',
            ],
          },
        },
      },
    });
  }

  async quotaStatus(
    memberId: string,
    at: Date,
  ): Promise<{ status: QuotaStatus; officialCount: number; max: number }> {
    const settings = await this.getSettings();
    const year = at.getFullYear();
    const month = at.getMonth() + 1;
    const officialCount = await this.countOfficialServicesInMonth(
      memberId,
      year,
      month,
    );
    return {
      status:
        officialCount >= settings.maxOfficialServicesPerMonth
          ? 'LOW_PRIORITY'
          : 'AVAILABLE',
      officialCount,
      max: settings.maxOfficialServicesPerMonth,
    };
  }
}
