import { Injectable } from '@nestjs/common';
import { MinistryScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  mapChoirOutcome,
  mapProtocolOutcome,
  ParticipationOperationalStatus,
} from './participation.constants';

export interface ParticipationRecordRow {
  memberId: string;
  recordedAt: Date;
  operationalStatus: ParticipationOperationalStatus;
  voluntaryExtra: boolean;
}

export interface ParticipationScoreInput {
  operationalStatus: ParticipationOperationalStatus | null;
  voluntaryExtra?: boolean;
}

@Injectable()
export class ParticipationRecordsService {
  constructor(private prisma: PrismaService) {}

  async fetchRecords(options: {
    since?: Date;
    until?: Date;
    memberIds?: string[];
    ministry?: MinistryScope | 'ALL';
  }): Promise<ParticipationRecordRow[]> {
    const { since, until, memberIds, ministry = 'ALL' } = options;
    const dateFilter: Prisma.DateTimeFilter | undefined =
      since || until
        ? {
            ...(since ? { gte: since } : {}),
            ...(until ? { lte: until } : {}),
          }
        : undefined;

    const includeChoir =
      ministry === 'ALL' || ministry === MinistryScope.CHOIR || ministry === MinistryScope.BOTH;
    const includeProtocol =
      ministry === 'ALL' ||
      ministry === MinistryScope.PROTOCOL ||
      ministry === MinistryScope.BOTH;

    const [choirRows, protocolRows] = await Promise.all([
      includeChoir
        ? this.prisma.choirAttendance.findMany({
            where: {
              ...(memberIds?.length ? { memberId: { in: memberIds } } : {}),
              ...(dateFilter ? { recordedAt: dateFilter } : {}),
            },
            select: {
              memberId: true,
              outcome: true,
              recordedAt: true,
            },
          })
        : Promise.resolve([]),
      includeProtocol
        ? this.prisma.protocolTeamAttendance.findMany({
            where: {
              ...(dateFilter ? { recordedAt: dateFilter } : {}),
              ...(memberIds?.length
                ? { teamMember: { memberId: { in: memberIds } } }
                : {}),
            },
            select: {
              outcome: true,
              recordedAt: true,
              teamMember: { select: { memberId: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    return [
      ...choirRows.map((row) => ({
        memberId: row.memberId,
        recordedAt: row.recordedAt,
        operationalStatus: mapChoirOutcome(row.outcome),
        voluntaryExtra: false,
      })),
      ...protocolRows.map((row) => ({
        memberId: row.teamMember.memberId,
        recordedAt: row.recordedAt,
        operationalStatus: mapProtocolOutcome(row.outcome),
        voluntaryExtra: false,
      })),
    ];
  }

  toScoreInputs(rows: ParticipationRecordRow[]): ParticipationScoreInput[] {
    return rows.map((row) => ({
      operationalStatus: row.operationalStatus,
      voluntaryExtra: row.voluntaryExtra,
    }));
  }

  async fetchScoreInputs(options: {
    since?: Date;
    until?: Date;
    memberIds?: string[];
    ministry?: MinistryScope | 'ALL';
  }): Promise<ParticipationScoreInput[]> {
    return this.toScoreInputs(await this.fetchRecords(options));
  }
}
