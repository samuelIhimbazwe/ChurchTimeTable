import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ChoirKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';
import { DeploymentReadinessService } from './deployment-readiness.service';

const CONFIG_ID = 'default';
const TOTAL_STEPS = 7;

export type SetupStepPayload = {
  step: number;
  data?: Record<string, unknown>;
};

@Injectable()
export class ChurchSetupService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private deploymentReadiness: DeploymentReadinessService,
  ) {}

  private async assertSetup(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_SETTINGS_MANAGE) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  private async ensureConfig() {
    return this.prisma.churchConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID },
      update: {},
    });
  }

  async getSetup(actorUserId: string) {
    await this.assertSetup(actorUserId);
    const config = await this.ensureConfig();
    const readiness = await this.deploymentReadiness.score(actorUserId);
    return {
      config,
      totalSteps: TOTAL_STEPS,
      steps: [
        { step: 1, key: 'churchInfo', title: 'Church Information' },
        { step: 2, key: 'leadership', title: 'Leadership' },
        { step: 3, key: 'ministries', title: 'Ministries' },
        { step: 4, key: 'choirs', title: 'Choirs' },
        { step: 5, key: 'protocol', title: 'Protocol' },
        { step: 6, key: 'services', title: 'Services' },
        { step: 7, key: 'review', title: 'Review' },
      ],
      readiness,
    };
  }

  async getStatus(actorUserId: string) {
    await this.assertSetup(actorUserId);
    const config = await this.ensureConfig();
    const readiness = await this.deploymentReadiness.score(actorUserId);
    return {
      demoModeEnabled: config.demoModeEnabled,
      ...readiness,
      setupCompleted: config.setupCompleted,
      setupStep: config.setupStep,
    };
  }

  async saveStep(actorUserId: string, payload: SetupStepPayload) {
    await this.assertSetup(actorUserId);
    const step = payload.step;
    if (step < 1 || step > TOTAL_STEPS) {
      throw new BadRequestException(`Step must be 1-${TOTAL_STEPS}`);
    }

    const data = payload.data ?? {};
    const update: Prisma.ChurchConfigurationUpdateInput = {
      setupStep: Math.max(step, (await this.ensureConfig()).setupStep),
    };

    switch (step) {
      case 1:
        update.churchInfo = data as Prisma.InputJsonValue;
        break;
      case 2:
        update.leadership = data as Prisma.InputJsonValue;
        break;
      case 3:
        update.ministriesConfig = data as Prisma.InputJsonValue;
        await this.applyMinistriesStep(data);
        break;
      case 4:
        update.choirsConfig = data as Prisma.InputJsonValue;
        await this.applyChoirsStep(data);
        break;
      case 5:
        update.protocolConfig = data as Prisma.InputJsonValue;
        update.protocolRules = (data.rules ?? data) as Prisma.InputJsonValue;
        break;
      case 6:
        update.servicesConfig = data as Prisma.InputJsonValue;
        update.serviceTimes = (data.serviceTimes ?? data) as Prisma.InputJsonValue;
        await this.applyServicesStep(data);
        break;
      case 7:
        update.setupCompleted = true;
        update.setupStep = TOTAL_STEPS;
        break;
      default:
        break;
    }

    const config = await this.prisma.churchConfiguration.update({
      where: { id: CONFIG_ID },
      data: update,
    });

    const readiness = await this.deploymentReadiness.score(actorUserId);
    return { config, readiness };
  }

  private async applyMinistriesStep(data: Record<string, unknown>) {
    const enabled = (data.enabled as string[] | undefined) ?? [];
    const disabled = (data.disabled as string[] | undefined) ?? [];
    for (const code of enabled) {
      await this.prisma.ministry.updateMany({
        where: { code },
        data: { isActive: true },
      });
    }
    for (const code of disabled) {
      await this.prisma.ministry.updateMany({
        where: { code },
        data: { isActive: false },
      });
    }
    const custom = data.custom as Array<{ code: string; name: string }> | undefined;
    if (custom?.length) {
      for (const row of custom) {
        await this.prisma.ministry.upsert({
          where: { code: row.code },
          create: {
            code: row.code,
            name: row.name,
            isActive: true,
          },
          update: { name: row.name, isActive: true },
        });
      }
    }
  }

  private async applyChoirsStep(data: Record<string, unknown>) {
    const choirs = data.choirs as
      | Array<{ code: string; name: string; choirKind?: ChoirKind }>
      | undefined;
    if (!choirs?.length) return;

    for (const row of choirs) {
      const id = row.code === 'main' ? MAIN_CHOIR_ID : undefined;
      await this.prisma.choir.upsert({
        where: id ? { id } : { code: row.code },
        create: {
          ...(id ? { id } : {}),
          code: row.code,
          name: row.name,
          choirKind: row.choirKind ?? ChoirKind.PRIMARY,
          isActive: true,
          isPublicJoinable: true,
        },
        update: {
          name: row.name,
          choirKind: row.choirKind ?? ChoirKind.PRIMARY,
          isActive: true,
        },
      });
    }
  }

  private async applyServicesStep(data: Record<string, unknown>) {
    const services = data.services as
      | Array<{ code: string; name: string; dayOfWeek?: number }>
      | undefined;
    if (!services?.length) return;

    for (const svc of services) {
      await this.prisma.operationTemplate.upsert({
        where: { code: svc.code },
        create: {
          code: svc.code,
          name: svc.name,
          type: 'SERVICE',
          isSystem: true,
          isActive: true,
        },
        update: { name: svc.name, isActive: true },
      });
    }
  }

  async updateLocalRules(
    actorUserId: string,
    rules: {
      choirRules?: Record<string, unknown>;
      protocolRules?: Record<string, unknown>;
      schedulingRules?: Record<string, unknown>;
      notificationRules?: Record<string, unknown>;
      attendanceRules?: Record<string, unknown>;
      serviceTimes?: Record<string, unknown>;
    },
  ) {
    await this.assertSetup(actorUserId);
    return this.prisma.churchConfiguration.update({
      where: { id: CONFIG_ID },
      data: {
        choirRules: rules.choirRules as Prisma.InputJsonValue | undefined,
        protocolRules: rules.protocolRules as Prisma.InputJsonValue | undefined,
        schedulingRules: rules.schedulingRules as Prisma.InputJsonValue | undefined,
        notificationRules: rules.notificationRules as Prisma.InputJsonValue | undefined,
        attendanceRules: rules.attendanceRules as Prisma.InputJsonValue | undefined,
        serviceTimes: rules.serviceTimes as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
