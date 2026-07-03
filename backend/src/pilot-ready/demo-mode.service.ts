import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { execSync } from 'node:child_process';
import path from 'node:path';

@Injectable()
export class DemoModeService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertDemo(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_SETTINGS_MANAGE) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async generate(actorUserId: string) {
    await this.assertDemo(actorUserId);
    const backendRoot = path.resolve(__dirname, '../..');
    execSync('npm run prisma:seed:pilot', {
      cwd: backendRoot,
      stdio: 'pipe',
      env: process.env,
    });

    await this.prisma.churchConfiguration.upsert({
      where: { id: 'default' },
      create: { id: 'default', demoModeEnabled: true },
      update: { demoModeEnabled: true },
    });

    const [members, choirs, occurrences, protocolTeams] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.choir.count({ where: { isActive: true } }),
      this.prisma.operationOccurrence.count(),
      this.prisma.protocolServiceTeam.count(),
    ]);

    return {
      demoModeEnabled: true,
      generated: {
        members,
        choirs,
        events: occurrences,
        protocolTeams,
      },
      message:
        'Demo data generated. Use pilot accounts from docs/pilot/ACCOUNTS.md (Pilot@123).',
    };
  }

  async status(actorUserId: string) {
    await this.assertDemo(actorUserId);
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    return { demoModeEnabled: config?.demoModeEnabled ?? false };
  }

  async clear(actorUserId: string) {
    await this.assertDemo(actorUserId);
    const backendRoot = path.resolve(__dirname, '../..');
    execSync('npm run prisma:clear-pilot', {
      cwd: backendRoot,
      stdio: 'pipe',
      env: process.env,
    });

    const [members, choirs] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.choir.count({ where: { isActive: true } }),
    ]);

    return {
      demoModeEnabled: false,
      cleared: true,
      remaining: { members, choirs },
      message: 'Demo data removed. Only baseline admin accounts remain.',
    };
  }
}
