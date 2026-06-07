import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChoirDissolutionTransferStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirDissolutionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertAdmin(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      resolved.roles.includes(ROLES.SUPER_ADMIN) ||
      resolved.roles.includes(ROLES.CHURCH_ADMIN) ||
      resolved.roles.includes(ROLES.CHOIR_ADMIN) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE);
    if (!allowed) {
      throw new ForbiddenException('Choir dissolution requires church admin access');
    }
    return resolved;
  }

  async list(actorUserId: string) {
    await this.assertAdmin(actorUserId);
    return this.prisma.choirDissolutionTransfer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sourceChoir: { select: { id: true, name: true, code: true, isActive: true } },
        targetChoir: { select: { id: true, name: true, code: true, isActive: true } },
      },
    });
  }

  async preview(actorUserId: string, sourceChoirId: string) {
    await this.assertAdmin(actorUserId);
    const source = await this.prisma.choir.findUnique({ where: { id: sourceChoirId } });
    if (!source) throw new NotFoundException('Source choir not found');

    const [activeMembers, families] = await Promise.all([
      this.prisma.choirMembership.count({
        where: { choirId: sourceChoirId, isActive: true },
      }),
      this.prisma.family.count({ where: { choirId: sourceChoirId } }),
    ]);

    return {
      sourceChoir: { id: source.id, name: source.name, code: source.code, isActive: source.isActive },
      activeMemberCount: activeMembers,
      familyCount: families,
    };
  }

  async execute(
    actorUserId: string,
    dto: { sourceChoirId: string; targetChoirId: string; reason?: string },
  ) {
    await this.assertAdmin(actorUserId);
    if (dto.sourceChoirId === dto.targetChoirId) {
      throw new BadRequestException('Source and target choir must differ');
    }

    const [source, target] = await Promise.all([
      this.prisma.choir.findUnique({ where: { id: dto.sourceChoirId } }),
      this.prisma.choir.findUnique({ where: { id: dto.targetChoirId } }),
    ]);
    if (!source) throw new NotFoundException('Source choir not found');
    if (!target?.isActive) throw new BadRequestException('Target choir must be active');

    const memberships = await this.prisma.choirMembership.findMany({
      where: { choirId: dto.sourceChoirId, isActive: true },
    });

    const record = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.choirDissolutionTransfer.create({
        data: {
          sourceChoirId: dto.sourceChoirId,
          targetChoirId: dto.targetChoirId,
          status: ChoirDissolutionTransferStatus.COMPLETED,
          reason: dto.reason?.trim(),
          memberCount: memberships.length,
          executedByUserId: actorUserId,
          executedAt: new Date(),
        },
      });

      for (const m of memberships) {
        await tx.choirMembership.update({
          where: { id: m.id },
          data: { isActive: false },
        });
        const existingTarget = await tx.choirMembership.findUnique({
          where: { userId_choirId: { userId: m.userId, choirId: dto.targetChoirId } },
        });
        if (existingTarget) {
          await tx.choirMembership.update({
            where: { id: existingTarget.id },
            data: { isActive: true, role: m.role },
          });
        } else {
          await tx.choirMembership.create({
            data: {
              userId: m.userId,
              choirId: dto.targetChoirId,
              role: m.role,
              isActive: true,
            },
          });
        }
      }

      await tx.family.updateMany({
        where: { choirId: dto.sourceChoirId },
        data: { choirId: dto.targetChoirId },
      });

      await tx.choir.update({
        where: { id: dto.sourceChoirId },
        data: { isActive: false },
      });

      return transfer;
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_DISSOLUTION_TRANSFER',
      entity: 'ChoirDissolutionTransfer',
      entityId: record.id,
      newValue: {
        sourceChoirId: dto.sourceChoirId,
        targetChoirId: dto.targetChoirId,
        memberCount: memberships.length,
      },
    });

    return this.prisma.choirDissolutionTransfer.findUniqueOrThrow({
      where: { id: record.id },
      include: {
        sourceChoir: { select: { id: true, name: true, code: true, isActive: true } },
        targetChoir: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
