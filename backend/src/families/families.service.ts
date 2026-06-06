import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyMemberRole,
  MinistryScope,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import type { OperationalScopeContext } from '../governance/operational-scope.types';
import { PERMISSIONS } from '../common/constants/roles';
import {
  canManageFamilies,
  canViewFamilies,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import {
  AddFamilyMemberDto,
  CreateFamilyDto,
  UpdateFamilyDto,
} from './dto/create-family.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UpdateFamilyPaymentDto } from './dto/update-family-payment.dto';

const MEMBER_SELECT = {
  id: true,
  memberNumber: true,
  firstName: true,
  lastName: true,
  ministry: true,
  status: true,
} as const;

@Injectable()
export class FamiliesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private operationalScope: OperationalScopeService,
  ) {}

  private formatFamilyCode(value: number): string {
    return `FAM${String(value).padStart(6, '0')}`;
  }

  async generateFamilyCode(tx?: Prisma.TransactionClient): Promise<string> {
    const allocate = async (client: Prisma.TransactionClient) => {
      await client.familyCodeSequence.upsert({
        where: { id: 'primary' },
        create: { id: 'primary', nextValue: 1 },
        update: {},
      });
      const updated = await client.familyCodeSequence.update({
        where: { id: 'primary' },
        data: { nextValue: { increment: 1 } },
      });
      return this.formatFamilyCode(updated.nextValue - 1);
    };

    if (tx) return allocate(tx);
    return this.prisma.$transaction(allocate);
  }

  async resolveScope(actorUserId: string) {
    return this.operationalScope.buildForUser(actorUserId);
  }

  private async scopeForUser(actorUserId: string) {
    return this.resolveScope(actorUserId);
  }

  ensureViewAccess(ctx: OperationalScopeContext) {
    this.assertView(ctx);
  }

  buildScopeWhere(ctx: OperationalScopeContext): Prisma.FamilyWhereInput {
    return this.buildScopedFamilyWhere(ctx);
  }

  async ensureFamilyInScope(ctx: OperationalScopeContext, familyId: string) {
    await this.assertFamilyInScope(ctx, familyId);
  }

  private assertView(ctx: OperationalScopeContext) {
    if (!canViewFamilies(ctx.permissions)) {
      throw new ForbiddenException('Family access denied');
    }
  }

  private assertManage(ctx: OperationalScopeContext) {
    if (!canManageFamilies(ctx.permissions)) {
      throw new ForbiddenException('Family management denied');
    }
  }

  private isGlobalFamilyAdmin(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE) &&
      hasEffectivePermission(permissions, PERMISSIONS.FAMILY_MANAGE)
    );
  }

  private buildScopedFamilyWhere(
    ctx: OperationalScopeContext,
  ): Prisma.FamilyWhereInput {
    if (this.isGlobalFamilyAdmin(ctx.permissions)) {
      return {};
    }

    if (!canViewFamilies(ctx.permissions)) {
      return { id: '__none__' };
    }

    const orConditions: Prisma.FamilyWhereInput[] = [
      { members: { none: {} } },
    ];

    if (ctx.scopedMemberIds.length) {
      orConditions.push({
        members: { some: { memberId: { in: ctx.scopedMemberIds } } },
      });
    }

    const ministryScopes = [
      ...new Set(
        ctx.ministryIds.filter(
          (value): value is MinistryScope =>
            value === MinistryScope.CHOIR ||
            value === MinistryScope.PROTOCOL ||
            value === MinistryScope.BOTH,
        ),
      ),
    ];

    if (ministryScopes.length) {
      orConditions.push({
        members: {
          some: { member: { ministry: { in: ministryScopes } } },
        },
      });
    }

    return { OR: orConditions };
  }

  private serializeMember(member: {
    id: string;
    memberNumber: string | null;
    firstName: string;
    lastName: string;
    ministry?: MinistryScope;
    status?: string;
  } | null) {
    if (!member) return null;
    return {
      id: member.id,
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      ministry: member.ministry,
      status: member.status,
    };
  }

  private serializeSummary(
    family: Pick<
      Prisma.FamilyGetPayload<{
        include: {
          headMember: { select: typeof MEMBER_SELECT };
          _count: { select: { members: true } };
        };
      }>,
      'id' | 'familyCode' | 'familyName' | 'headMember' | '_count'
    >,
    health?: { score: number; grade: string },
  ) {
    return {
      id: family.id,
      familyCode: family.familyCode,
      familyName: family.familyName,
      headMember: this.serializeMember(family.headMember),
      memberCount: family._count.members,
      ...(health
        ? { healthScore: health.score, healthGrade: health.grade }
        : {}),
    };
  }

  private serializeDetail(
    family: Prisma.FamilyGetPayload<{
      include: {
        headMember: { select: typeof MEMBER_SELECT };
        members: { include: { member: { select: typeof MEMBER_SELECT } } };
      };
    }>,
  ) {
    return {
      id: family.id,
      familyCode: family.familyCode,
      familyName: family.familyName,
      notes: family.notes,
      paymentMomoNumber: family.paymentMomoNumber,
      paymentMomoAccountName: family.paymentMomoAccountName,
      paymentBankAccount: family.paymentBankAccount,
      paymentBankName: family.paymentBankName,
      paymentInstructions: family.paymentInstructions,
      headMember: this.serializeMember(family.headMember),
      members: family.members.map((row) => ({
        id: row.id,
        memberId: row.memberId,
        role: row.role,
        joinedAt: row.joinedAt,
        member: this.serializeMember(row.member),
      })),
    };
  }

  private detailInclude() {
    return {
      headMember: { select: MEMBER_SELECT },
      members: {
        include: { member: { select: MEMBER_SELECT } },
        orderBy: { joinedAt: 'asc' as const },
      },
    };
  }

  private async assertFamilyInScope(
    ctx: OperationalScopeContext,
    familyId: string,
  ) {
    const where = {
      id: familyId,
      ...this.buildScopedFamilyWhere(ctx),
    };
    const family = await this.prisma.family.findFirst({ where, select: { id: true } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }
  }

  private async assertMemberInScope(
    ctx: OperationalScopeContext,
    memberId: string,
  ) {
    if (this.isGlobalFamilyAdmin(ctx.permissions)) return;

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, ministry: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (ctx.scopedMemberIds.includes(memberId)) {
      return;
    }

    const ministryScopes = ctx.ministryIds.filter(
      (value): value is MinistryScope =>
        value === MinistryScope.CHOIR ||
        value === MinistryScope.PROTOCOL ||
        value === MinistryScope.BOTH,
    );

    if (ministryScopes.includes(member.ministry)) {
      return;
    }

    throw new ForbiddenException('Member outside operational scope');
  }

  private async assertHeadMemberInFamily(
    familyId: string,
    headMemberId: string | null | undefined,
  ) {
    if (!headMemberId) return;

    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, memberId: headMemberId },
    });
    if (!membership) {
      throw new BadRequestException('Head member must belong to the same family');
    }
  }

  private async syncHeadRole(
    familyId: string,
    headMemberId: string | null,
    assignedByUserId?: string,
  ) {
    const currentHeads = await this.prisma.familyMember.findMany({
      where: { familyId, role: FamilyMemberRole.HEAD },
      select: { memberId: true },
    });

    await this.prisma.familyMember.updateMany({
      where: { familyId, role: FamilyMemberRole.HEAD },
      data: { role: FamilyMemberRole.MEMBER },
    });

    for (const head of currentHeads) {
      if (head.memberId !== headMemberId) {
        await this.closeLeadershipHistory(
          familyId,
          head.memberId,
          FamilyMemberRole.HEAD,
          assignedByUserId,
        );
      }
    }

    if (headMemberId) {
      await this.prisma.familyMember.updateMany({
        where: { familyId, memberId: headMemberId },
        data: { role: FamilyMemberRole.HEAD },
      });
      await this.openLeadershipHistory(
        familyId,
        headMemberId,
        FamilyMemberRole.HEAD,
        assignedByUserId,
      );
    }
  }

  private leadershipRoles(): FamilyMemberRole[] {
    return [
      FamilyMemberRole.HEAD,
      FamilyMemberRole.ASSISTANT_HEAD,
      FamilyMemberRole.SECRETARY,
    ];
  }

  private async openLeadershipHistory(
    familyId: string,
    memberId: string,
    role: FamilyMemberRole,
    assignedByUserId?: string,
    reason?: string,
  ) {
    if (!this.leadershipRoles().includes(role)) return;

    const row = await this.prisma.familyLeadershipHistory.create({
      data: {
        familyId,
        memberId,
        role,
        assignedByUserId,
      },
    });

    if (assignedByUserId) {
      await this.audit.log({
        userId: assignedByUserId,
        action: 'FAMILY_LEADERSHIP_ASSIGNED',
        entity: 'FamilyLeadershipHistory',
        entityId: row.id,
        newValue: {
          familyId,
          memberId,
          role,
          reason: reason?.trim() ?? null,
          actorId: assignedByUserId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  private async closeLeadershipHistory(
    familyId: string,
    memberId: string,
    role: FamilyMemberRole,
    actorUserId?: string,
    reason?: string,
  ) {
    const open = await this.prisma.familyLeadershipHistory.findFirst({
      where: { familyId, memberId, role, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!open) return;

    const endedAt = new Date();
    await this.prisma.familyLeadershipHistory.update({
      where: { id: open.id },
      data: { endedAt },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'FAMILY_LEADERSHIP_ENDED',
        entity: 'FamilyLeadershipHistory',
        entityId: open.id,
        oldValue: { role, memberId, familyId, startedAt: open.startedAt },
        newValue: {
          familyId,
          memberId,
          role,
          endedAt: endedAt.toISOString(),
          reason: reason?.trim() ?? null,
          actorId: actorUserId,
          timestamp: endedAt.toISOString(),
        },
      });
    }
  }

  async list(
    actorUserId: string,
    page = 1,
    limit = 50,
    includeMemberIds = false,
    filters?: { familyId?: string; search?: string },
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertView(ctx);

    const scopeWhere = this.buildScopedFamilyWhere(ctx);
    const andFilters: Prisma.FamilyWhereInput[] = [scopeWhere];
    const choirId = getActiveChoirId();
    andFilters.push({ OR: [{ choirId }, { choirId: null }] });

    if (filters?.familyId) {
      andFilters.push({ id: filters.familyId });
    }

    const search = filters?.search?.trim();
    if (search) {
      andFilters.push({
        OR: [
          { familyName: { contains: search } },
          { familyCode: { contains: search } },
        ],
      });
    }

    const where: Prisma.FamilyWhereInput = { AND: andFilters };

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy: { familyName: 'asc' },
        include: {
          headMember: { select: MEMBER_SELECT },
          _count: { select: { members: true } },
          ...(includeMemberIds
            ? { members: { select: { memberId: true } } }
            : {}),
        },
      }),
      this.prisma.family.count({ where }),
    ]);

    return {
      items: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  serializeListItem(
    family: Prisma.FamilyGetPayload<{
      include: {
        headMember: { select: typeof MEMBER_SELECT };
        _count: { select: { members: true } };
      };
    }>,
    health?: { score: number; grade: string },
  ) {
    return this.serializeSummary(family, health);
  }

  async findOne(actorUserId: string, familyId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertView(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: this.detailInclude(),
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return this.serializeDetail(family);
  }

  async create(actorUserId: string, dto: CreateFamilyDto) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);

    if (dto.headMemberId) {
      await this.assertMemberInScope(ctx, dto.headMemberId);
      const existing = await this.prisma.familyMember.findUnique({
        where: { memberId: dto.headMemberId },
      });
      if (existing) {
        throw new BadRequestException('Member already belongs to a family');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const familyCode = await this.generateFamilyCode(tx);
      const family = await tx.family.create({
        data: {
          choirId: getActiveChoirId(),
          familyCode,
          familyName: dto.familyName,
          notes: dto.notes,
          headMemberId: dto.headMemberId,
        },
        include: this.detailInclude(),
      });

      if (dto.headMemberId) {
        await tx.familyMember.create({
          data: {
            familyId: family.id,
            memberId: dto.headMemberId,
            role: FamilyMemberRole.HEAD,
          },
        });
      }

      return tx.family.findUniqueOrThrow({
        where: { id: family.id },
        include: this.detailInclude(),
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_CREATE',
      entity: 'Family',
      entityId: created.id,
      newValue: { familyCode: created.familyCode, familyName: created.familyName },
    });

    if (dto.headMemberId) {
      await this.openLeadershipHistory(
        created.id,
        dto.headMemberId,
        FamilyMemberRole.HEAD,
        actorUserId,
      );
    }

    return this.serializeDetail(created);
  }

  async update(actorUserId: string, familyId: string, dto: UpdateFamilyDto) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    if (dto.headMemberId) {
      await this.assertHeadMemberInFamily(familyId, dto.headMemberId);
    }

    const existing = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { delegationEnabled: true },
    });
    if (!existing) {
      throw new NotFoundException('Family not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const family = await tx.family.update({
        where: { id: familyId },
        data: {
          familyName: dto.familyName,
          notes: dto.notes,
          headMemberId: dto.headMemberId,
          ...(dto.delegationEnabled !== undefined
            ? { delegationEnabled: dto.delegationEnabled }
            : {}),
        },
      });

      if (dto.headMemberId !== undefined) {
        await this.syncHeadRole(family.id, dto.headMemberId, actorUserId);
      }

      return tx.family.findUniqueOrThrow({
        where: { id: familyId },
        include: this.detailInclude(),
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_UPDATE',
      entity: 'Family',
      entityId: familyId,
      newValue: dto as Prisma.InputJsonValue,
    });

    if (
      dto.delegationEnabled !== undefined &&
      dto.delegationEnabled !== existing.delegationEnabled
    ) {
      await this.audit.log({
        userId: actorUserId,
        action: 'FAMILY_DELEGATION_TOGGLE',
        entity: 'Family',
        entityId: familyId,
        oldValue: { delegationEnabled: existing.delegationEnabled },
        newValue: {
          delegationEnabled: dto.delegationEnabled,
          actorId: actorUserId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return this.serializeDetail(updated);
  }

  async updatePaymentInstructions(
    actorUserId: string,
    familyId: string,
    dto: UpdateFamilyPaymentDto,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    await this.assertFamilyInScope(ctx, familyId);

    if (!ctx.memberId && !canManageFamilies(ctx.permissions)) {
      throw new ForbiddenException('Member profile required');
    }

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        id: true,
        delegationEnabled: true,
        headMemberId: true,
      },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const canManage = canManageFamilies(ctx.permissions);
    let canEditAsHead = false;
    if (ctx.memberId) {
      const membership = await this.prisma.familyMember.findFirst({
        where: { familyId, memberId: ctx.memberId },
        select: { role: true },
      });
      canEditAsHead =
        membership?.role === FamilyMemberRole.HEAD ||
        (membership?.role === FamilyMemberRole.ASSISTANT_HEAD &&
          family.delegationEnabled);
    }

    if (!canManage && !canEditAsHead) {
      throw new ForbiddenException(
        'Only the family head (or family coordinator) can update payment instructions',
      );
    }

    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: {
        paymentMomoNumber: dto.paymentMomoNumber ?? undefined,
        paymentMomoAccountName: dto.paymentMomoAccountName ?? undefined,
        paymentBankAccount: dto.paymentBankAccount ?? undefined,
        paymentBankName: dto.paymentBankName ?? undefined,
        paymentInstructions: dto.paymentInstructions ?? undefined,
      },
      include: this.detailInclude(),
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_PAYMENT_INSTRUCTIONS_UPDATE',
      entity: 'Family',
      entityId: familyId,
      newValue: {
        ...dto,
        actorId: actorUserId,
        timestamp: new Date().toISOString(),
      },
    });

    return this.serializeDetail(updated);
  }

  async getLeadershipHistory(actorUserId: string, familyId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertView(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    const rows = await this.prisma.familyLeadershipHistory.findMany({
      where: { familyId },
      orderBy: { startedAt: 'asc' },
      include: {
        member: {
          select: {
            id: true,
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      familyId,
      items: rows.map((row) => ({
        id: row.id,
        memberId: row.memberId,
        memberNumber: row.member.memberNumber,
        memberName: `${row.member.firstName} ${row.member.lastName}`.trim(),
        role: row.role,
        startedAt: row.startedAt,
        endedAt: row.endedAt,
        assignedByUserId: row.assignedByUserId,
      })),
    };
  }

  async updateMemberRole(
    actorUserId: string,
    familyId: string,
    memberId: string,
    dto: UpdateFamilyMemberDto,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, memberId },
    });
    if (!membership) {
      throw new NotFoundException('Family membership not found');
    }

    const oldRole = membership.role;
    const newRole = dto.role;
    if (oldRole === newRole) {
      return this.findOne(actorUserId, familyId);
    }

    if (newRole === FamilyMemberRole.HEAD) {
      const headExists = await this.prisma.familyMember.findFirst({
        where: {
          familyId,
          role: FamilyMemberRole.HEAD,
          memberId: { not: memberId },
        },
      });
      if (headExists) {
        throw new BadRequestException('Family already has a head member');
      }
    }

    const timestamp = new Date().toISOString();

    if (this.leadershipRoles().includes(oldRole)) {
      await this.closeLeadershipHistory(
        familyId,
        memberId,
        oldRole,
        actorUserId,
        dto.reason,
      );
    }

    await this.prisma.familyMember.update({
      where: { id: membership.id },
      data: { role: newRole },
    });

    if (newRole === FamilyMemberRole.HEAD) {
      await this.prisma.family.update({
        where: { id: familyId },
        data: { headMemberId: memberId },
      });
    } else if (oldRole === FamilyMemberRole.HEAD) {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        select: { headMemberId: true },
      });
      if (family?.headMemberId === memberId) {
        await this.prisma.family.update({
          where: { id: familyId },
          data: { headMemberId: null },
        });
      }
    }

    if (this.leadershipRoles().includes(newRole)) {
      await this.openLeadershipHistory(
        familyId,
        memberId,
        newRole,
        actorUserId,
        dto.reason,
      );
    }

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_MEMBER_ROLE_CHANGE',
      entity: 'FamilyMember',
      entityId: membership.id,
      oldValue: { role: oldRole, memberId, familyId },
      newValue: {
        oldRole,
        newRole,
        memberId,
        familyId,
        reason: dto.reason?.trim() ?? null,
        actorId: actorUserId,
        timestamp,
      },
    });

    return this.findOne(actorUserId, familyId);
  }

  async remove(actorUserId: string, familyId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    await this.prisma.family.delete({ where: { id: familyId } });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_DELETE',
      entity: 'Family',
      entityId: familyId,
    });

    return { deleted: true };
  }

  async addMember(
    actorUserId: string,
    familyId: string,
    dto: AddFamilyMemberDto,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);
    await this.assertFamilyInScope(ctx, familyId);
    await this.assertMemberInScope(ctx, dto.memberId);

    const role = dto.role ?? FamilyMemberRole.MEMBER;

    const existingMembership = await this.prisma.familyMember.findUnique({
      where: { memberId: dto.memberId },
    });
    if (existingMembership) {
      throw new BadRequestException('Member already belongs to a family');
    }

    if (role === FamilyMemberRole.HEAD) {
      const headExists = await this.prisma.familyMember.findFirst({
        where: { familyId, role: FamilyMemberRole.HEAD },
      });
      if (headExists) {
        throw new BadRequestException('Family already has a head member');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.familyMember.create({
        data: {
          familyId,
          memberId: dto.memberId,
          role,
        },
      });

      if (role === FamilyMemberRole.HEAD) {
        await tx.family.update({
          where: { id: familyId },
          data: { headMemberId: dto.memberId },
        });
      }

      return tx.family.findUniqueOrThrow({
        where: { id: familyId },
        include: this.detailInclude(),
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_MEMBER_ADD',
      entity: 'FamilyMember',
      entityId: familyId,
      newValue: { memberId: dto.memberId, role },
    });

    await this.openLeadershipHistory(familyId, dto.memberId, role, actorUserId);

    return this.serializeDetail(created);
  }

  async removeMember(
    actorUserId: string,
    familyId: string,
    memberId: string,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    this.assertManage(ctx);
    await this.assertFamilyInScope(ctx, familyId);

    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, memberId },
    });
    if (!membership) {
      throw new NotFoundException('Family membership not found');
    }

    await this.closeLeadershipHistory(
      familyId,
      memberId,
      membership.role,
      actorUserId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.familyMember.delete({ where: { id: membership.id } });

      const family = await tx.family.findUnique({
        where: { id: familyId },
        select: { headMemberId: true },
      });
      if (family?.headMemberId === memberId) {
        await tx.family.update({
          where: { id: familyId },
          data: { headMemberId: null },
        });
      }
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FAMILY_MEMBER_REMOVE',
      entity: 'FamilyMember',
      entityId: familyId,
      oldValue: { memberId },
    });

    return this.findOne(actorUserId, familyId);
  }
}
