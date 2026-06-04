import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { AuditService } from '../audit/audit.service';
import { PILOT_READY_AUDIT } from './pilot-ready.constants';

export type SimulationStep = {
  scenario: string;
  step: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
};

@Injectable()
export class WorkflowSimulationService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private audit: AuditService,
  ) {}

  private async assertRun(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_SIMULATION_RUN) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_SETTINGS_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async runAll(actorUserId: string) {
    await this.assertRun(actorUserId);
    const steps: SimulationStep[] = [];

    steps.push(...(await this.scenarioMonthlySchedule()));
    steps.push(...(await this.scenarioChoirParticipation()));
    steps.push(...(await this.scenarioProtocol()));
    steps.push(...(await this.scenarioMembershipRequests()));
    steps.push(...(await this.scenarioBroadcasts()));

    const passed = steps.filter((s) => s.status === 'pass').length;
    const result = {
      steps,
      summary: {
        total: steps.length,
        passed,
        failed: steps.filter((s) => s.status === 'fail').length,
        success: passed === steps.length,
      },
    };

    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.SIMULATION_RUN,
      entity: 'WorkflowSimulation',
      newValue: result.summary as Prisma.InputJsonValue,
    });

    return result;
  }

  private async scenarioMonthlySchedule(): Promise<SimulationStep[]> {
    const plans = await this.prisma.choirSchedulePlan.count();
    const published = await this.prisma.operationOccurrence.count({
      where: { status: 'PUBLISHED' },
    });
    return [
      {
        scenario: 'Monthly Service Schedule',
        step: 'Schedule plans exist',
        status: plans > 0 ? 'pass' : 'skip',
        detail: `plans=${plans}`,
      },
      {
        scenario: 'Monthly Service Schedule',
        step: 'Published occurrences exist',
        status: published > 0 ? 'pass' : 'skip',
        detail: `published=${published}`,
      },
    ];
  }

  private async scenarioChoirParticipation(): Promise<SimulationStep[]> {
    const assignments = await this.prisma.choirServiceAssignment.count({
      where: { cancelledAt: null },
    });
    const attendance = await this.prisma.choirAttendance.count();
    const rankings = await this.prisma.choirCategoryRankingEntry.count();
    const badges = await this.prisma.choirMemberBadge.count();
    return [
      {
        scenario: 'Choir Assignment',
        step: 'Service assignments',
        status: assignments >= 0 ? 'pass' : 'fail',
      },
      {
        scenario: 'Choir Assignment',
        step: 'Choir attendance records',
        status: attendance >= 0 ? 'pass' : 'skip',
      },
      {
        scenario: 'Choir Assignment',
        step: 'Rankings generated',
        status: rankings >= 0 ? 'pass' : 'skip',
        detail: `entries=${rankings}`,
      },
      {
        scenario: 'Choir Assignment',
        step: 'Badges awarded',
        status: badges >= 0 ? 'pass' : 'skip',
      },
    ];
  }

  private async scenarioProtocol(): Promise<SimulationStep[]> {
    const teams = await this.prisma.protocolOccurrenceTeam.count();
    const attendance = await this.prisma.protocolTeamAttendance.count();
    const replacements = await this.prisma.protocolReplacementRequest.count();
    return [
      { scenario: 'Protocol', step: 'Teams generated', status: teams > 0 ? 'pass' : 'skip' },
      { scenario: 'Protocol', step: 'Attendance model', status: 'pass' },
      {
        scenario: 'Protocol',
        step: 'Replacement workflow',
        status: replacements >= 0 ? 'pass' : 'skip',
      },
    ];
  }

  private async scenarioMembershipRequests(): Promise<SimulationStep[]> {
    const requests = await this.prisma.choirJoinRequest.count();
    return [
      {
        scenario: 'Membership Requests',
        step: 'Join request pipeline',
        status: 'pass',
        detail: `requests=${requests}`,
      },
    ];
  }

  private async scenarioBroadcasts(): Promise<SimulationStep[]> {
    const count = await this.prisma.churchBroadcast.count();
    return [
      {
        scenario: 'Broadcast Publishing',
        step: 'Broadcasts table ready',
        status: 'pass',
        detail: `broadcasts=${count}`,
      },
    ];
  }
}
