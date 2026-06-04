import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationRuleTrigger } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { DEFAULT_NOTIFICATION_RULES } from './pilot-ready.constants';

@Injectable()
export class NotificationRulesService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async onModuleInit() {
    for (const rule of DEFAULT_NOTIFICATION_RULES) {
      const trigger = rule.trigger as NotificationRuleTrigger;
      const config =
        trigger === 'EVENT_REMINDER'
          ? { daysBefore: [7, 2, 0] }
          : undefined;
      await this.prisma.notificationRule.upsert({
        where: { trigger },
        create: {
          trigger,
          channel: rule.channel as 'IN_APP',
          enabled: true,
          config,
        },
        update: config ? { config } : {},
      });
    }
  }

  private async assertManage(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_SETTINGS_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async list(actorUserId: string) {
    await this.assertManage(actorUserId);
    return this.prisma.notificationRule.findMany({ orderBy: { trigger: 'asc' } });
  }

  async isEnabled(trigger: NotificationRuleTrigger): Promise<boolean> {
    const rule = await this.prisma.notificationRule.findUnique({
      where: { trigger },
    });
    return rule?.enabled ?? true;
  }

  async update(
    actorUserId: string,
    trigger: NotificationRuleTrigger,
    data: { enabled?: boolean; channel?: 'IN_APP' | 'PUSH' | 'EMAIL' },
  ) {
    await this.assertManage(actorUserId);
    return this.prisma.notificationRule.update({
      where: { trigger },
      data,
    });
  }
}
