import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadershipAssignmentScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { AuditService } from '../audit/audit.service';
import {
  assertChurchIntelligenceManage,
  assertChurchGovernanceView,
} from './church-intelligence.util';
import {
  CHURCH_INTELLIGENCE_AUDIT,
  CHURCH_INTELLIGENCE_AUDIT_ENTITY,
} from './church-intelligence.constants';

@Injectable()
export class LeadershipTermService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string) {
    await assertChurchGovernanceView(this.access, actorUserId);
    return this.prisma.leadershipTerm.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
  }

  async upsert(
    actorUserId: string,
    dto: {
      assignmentScope: LeadershipAssignmentScope;
      assignmentId: string;
      startedAt: string;
      expectedEndAt?: string;
      endedAt?: string;
      notes?: string;
    },
  ) {
    await assertChurchIntelligenceManage(this.access, actorUserId);
    await this.assertAssignmentExists(dto.assignmentScope, dto.assignmentId);

    const term = await this.prisma.leadershipTerm.upsert({
      where: {
        assignmentScope_assignmentId: {
          assignmentScope: dto.assignmentScope,
          assignmentId: dto.assignmentId,
        },
      },
      create: {
        assignmentScope: dto.assignmentScope,
        assignmentId: dto.assignmentId,
        startedAt: new Date(dto.startedAt),
        expectedEndAt: dto.expectedEndAt ? new Date(dto.expectedEndAt) : null,
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        notes: dto.notes,
      },
      update: {
        startedAt: new Date(dto.startedAt),
        expectedEndAt: dto.expectedEndAt ? new Date(dto.expectedEndAt) : null,
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_INTELLIGENCE_AUDIT.TERM_UPSERTED,
      entity: CHURCH_INTELLIGENCE_AUDIT_ENTITY.LEADERSHIP_TERM,
      entityId: term.id,
      newValue: { assignmentScope: dto.assignmentScope },
    });

    return term;
  }

  private async assertAssignmentExists(
    scope: LeadershipAssignmentScope,
    assignmentId: string,
  ) {
    if (scope === LeadershipAssignmentScope.MINISTRY) {
      const row = await this.prisma.ministryLeadershipAssignment.findUnique({
        where: { id: assignmentId },
      });
      if (!row) throw new NotFoundException('Ministry assignment not found');
      return;
    }
    const row = await this.prisma.operationalUnitLeadershipAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!row) throw new NotFoundException('Unit assignment not found');
  }
}
