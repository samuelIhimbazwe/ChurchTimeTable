import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class DataQualityService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertView(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_USERS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_INTELLIGENCE_VIEW)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async metrics(actorUserId: string) {
    await this.assertView(actorUserId);

    const members = await this.prisma.member.findMany({
      select: { id: true, phone: true, firstName: true, lastName: true, status: true },
    });

    const missingPhones = members.filter((m) => !m.phone?.trim());
    const activeMembers = members.filter((m) => m.status === 'ACTIVE');

    const duplicatePhones = await this.findDuplicatePhones();

    const ministries = await this.prisma.ministry.findMany({
      include: {
        _count: { select: { leadershipAssignments: true, memberships: true } },
      },
    });
    const inactiveMinistries = ministries.filter((m) => !m.isActive);
    const missingLeadership = ministries.filter(
      (m) => m.isActive && m._count.leadershipAssignments === 0,
    );

    const units = await this.prisma.operationalUnit.findMany({
      where: { isActive: false },
      select: { id: true, name: true, code: true },
    });

    const orphanAssignments = await this.prisma.operationAssignment.count({
      where: { member: { status: { not: 'ACTIVE' } } },
    });

    const membersWithoutChoir = await this.prisma.member.count({
      where: {
        status: 'ACTIVE',
        user: { choirMemberships: { none: { isActive: true } } },
      },
    });

    return {
      missingPhoneNumbers: missingPhones.length,
      missingPhoneSample: missingPhones.slice(0, 10).map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
      })),
      duplicateMembers: duplicatePhones,
      missingLeadership: missingLeadership.map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
      })),
      inactiveMinistries: inactiveMinistries.map((m) => ({
        id: m.id,
        name: m.name,
      })),
      inactiveUnits: units,
      invalidAssignments: orphanAssignments,
      orphanRecords: {
        activeMembersWithoutChoir: membersWithoutChoir,
      },
      totals: {
        members: members.length,
        activeMembers: activeMembers.length,
      },
    };
  }

  private async findDuplicatePhones() {
    const members = await this.prisma.member.findMany({
      where: { phone: { not: null } },
      select: { phone: true, firstName: true, lastName: true },
    });
    const byPhone = new Map<string, typeof members>();
    for (const m of members) {
      const key = m.phone!.trim();
      if (!key) continue;
      const list = byPhone.get(key) ?? [];
      list.push(m);
      byPhone.set(key, list);
    }
    return [...byPhone.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([phone, list]) => ({
        phone,
        members: list.map((m) => `${m.firstName} ${m.lastName}`),
      }));
  }
}
