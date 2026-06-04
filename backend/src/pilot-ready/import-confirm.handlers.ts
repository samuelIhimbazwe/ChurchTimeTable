import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ChurchOperationType,
  ImportJobType,
  MemberStatus,
  MinistryMembershipStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MemberNumberService } from '../members/member-number.service';
import { ChoirContextService } from '../choirs/choir-context.service';
import { ROLES } from '../common/constants/roles';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';
import type { ImportConflictStrategy, ImportPreview } from './imports.service';
import { rowNum, rowVal } from './import-row.util';

export type ImportApplyResult = {
  applied: Array<{ row: number; entityId?: string; entityType?: string }>;
  failed: Array<{ row: number; error: string }>;
  skipped: Array<{ row: number; reason: string }>;
};

@Injectable()
export class ImportConfirmHandlers {
  constructor(
    private prisma: PrismaService,
    private memberNumbers: MemberNumberService,
    private choirContext: ChoirContextService,
  ) {}

  resolveRows(preview: ImportPreview, strategy: ImportConflictStrategy) {
    if (strategy === 'MANUAL_REVIEW' && preview.conflictRows.length > 0) {
      throw new BadRequestException(
        'Resolve conflicts manually before confirming (MANUAL_REVIEW)',
      );
    }
    const rows: Array<Record<string, unknown>> = [...preview.validRows];
    if (strategy === 'REPLACE' || strategy === 'MERGE') {
      for (const conflict of preview.conflictRows) {
        rows.push({
          ...conflict.data,
          __rowNumber: conflict.row,
          __isConflict: true,
        });
      }
    }
    return rows;
  }

  async confirm(
    type: ImportJobType,
    preview: ImportPreview,
    strategy: ImportConflictStrategy,
    actorUserId: string,
  ): Promise<ImportApplyResult> {
    const rows = this.resolveRows(preview, strategy);
    const result: ImportApplyResult = { applied: [], failed: [], skipped: [] };

    if (strategy === 'SKIP') {
      for (const conflict of preview.conflictRows) {
        result.skipped.push({ row: conflict.row, reason: conflict.reason });
      }
    }

    for (const row of rows) {
      const num = rowNum(row);
      if (row.__skipReason) {
        result.skipped.push({ row: num, reason: String(row.__skipReason) });
        continue;
      }
      try {
        const entity = await this.applyRow(type, row, strategy, actorUserId);
        result.applied.push({ row: num, ...entity });
      } catch (err) {
        result.failed.push({
          row: num,
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    return result;
  }

  private async applyRow(
    type: ImportJobType,
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
    actorUserId: string,
  ): Promise<{ entityId?: string; entityType?: string }> {
    switch (type) {
      case 'MEMBERS':
        return this.applyMember(row, strategy);
      case 'CHOIR_MEMBERS':
        return this.applyChoirMember(row, strategy);
      case 'PROTOCOL_MEMBERS':
        return this.applyProtocolMember(row, strategy);
      case 'MINISTRIES':
        return this.applyMinistry(row, strategy);
      case 'MINISTRY_MEMBERS':
        return this.applyMinistryMember(row, strategy);
      case 'LEADERSHIP_ASSIGNMENTS':
        return this.applyLeadership(row, strategy, actorUserId);
      case 'ASSETS':
        return this.applyAsset(row, strategy, actorUserId);
      case 'SCHEDULES':
        return this.applySchedule(row, strategy, actorUserId);
      default:
        throw new BadRequestException(`Unsupported import type ${type}`);
    }
  }

  private async findMember(row: Record<string, unknown>) {
    const email = rowVal(row, 'email').toLowerCase();
    const memberNumber = rowVal(row, 'membernumber', 'member number');
    if (email) {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { member: true },
      });
      if (user?.member) return user.member;
    }
    if (memberNumber) {
      const member = await this.prisma.member.findFirst({ where: { memberNumber } });
      if (member) return member;
    }
    throw new BadRequestException('Member not found for row');
  }

  private async applyMember(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
  ) {
    const email = rowVal(row, 'email').toLowerCase();
    const firstName = rowVal(row, 'firstname', 'first name');
    const lastName = rowVal(row, 'lastname', 'last name');
    const phone = rowVal(row, 'phone') || undefined;
    const existing = email
      ? await this.prisma.user.findUnique({ where: { email }, include: { member: true } })
      : null;

    if (existing?.member) {
      if (strategy === 'SKIP') {
        throw new BadRequestException('Conflict skipped');
      }
      if (strategy === 'MERGE' || strategy === 'REPLACE') {
        await this.prisma.member.update({
          where: { id: existing.member.id },
          data: {
            firstName: firstName || existing.member.firstName,
            lastName: lastName || existing.member.lastName,
            phone: phone ?? existing.member.phone,
            status: MemberStatus.ACTIVE,
          },
        });
        return { entityId: existing.member.id, entityType: 'Member' };
      }
    }

    const memberRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const passwordHash = await bcrypt.hash('ChangeMe1!', 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber = await this.memberNumbers.generateMemberNumber(tx);
      return tx.user.create({
        data: {
          email,
          passwordHash,
          member: {
            create: {
              firstName,
              lastName,
              phone,
              status: MemberStatus.ACTIVE,
              memberNumber,
              onboardingCompleted: false,
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });
    });
    return { entityId: user.member?.id, entityType: 'Member' };
  }

  private async applyChoirMember(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
  ) {
    const member = await this.findMember(row);
    const choirCode = rowVal(row, 'choircode', 'choir code', 'code') || 'main';
    const role = rowVal(row, 'role') || ROLES.MEMBER;
    const choir =
      choirCode === 'main'
        ? await this.prisma.choir.findUniqueOrThrow({ where: { id: MAIN_CHOIR_ID } })
        : await this.prisma.choir.findUniqueOrThrow({ where: { code: choirCode } });

    const existing = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId: member.userId, choirId: choir.id } },
    });

    if (existing && strategy === 'SKIP') {
      throw new BadRequestException('Choir membership already exists');
    }

    await this.choirContext.ensureMembership(member.userId, choir.id, role);
    return { entityId: member.id, entityType: 'ChoirMembership' };
  }

  private async applyProtocolMember(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
  ) {
    const member = await this.findMember(row);
    const unitCode = rowVal(row, 'unitcode', 'unit code', 'code') || 'PROTOCOL_TEAM';
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: unitCode },
    });
    if (!unit) throw new BadRequestException(`Operational unit ${unitCode} not found`);

    const existing = await this.prisma.operationalUnitMembership.findUnique({
      where: {
        operationalUnitId_memberId: {
          operationalUnitId: unit.id,
          memberId: member.id,
        },
      },
    });

    if (existing && strategy === 'SKIP') {
      throw new BadRequestException('Protocol membership already exists');
    }

    await this.prisma.operationalUnitMembership.upsert({
      where: {
        operationalUnitId_memberId: {
          operationalUnitId: unit.id,
          memberId: member.id,
        },
      },
      create: {
        operationalUnitId: unit.id,
        memberId: member.id,
        status: MinistryMembershipStatus.ACTIVE,
      },
      update: { status: MinistryMembershipStatus.ACTIVE },
    });
    return { entityId: member.id, entityType: 'OperationalUnitMembership' };
  }

  private async applyMinistry(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
  ) {
    const code = rowVal(row, 'code', 'ministrycode', 'ministry code');
    const name = rowVal(row, 'name', 'ministryname', 'ministry name');
    if (!code || !name) throw new BadRequestException('code and name required');

    const existing = await this.prisma.ministry.findUnique({ where: { code } });
    if (existing && strategy === 'SKIP') {
      throw new BadRequestException('Ministry already exists');
    }

    const ministry = await this.prisma.ministry.upsert({
      where: { code },
      create: {
        code,
        name,
        description: rowVal(row, 'description') || undefined,
        isActive: true,
      },
      update: {
        name,
        description: rowVal(row, 'description') || undefined,
        isActive: true,
      },
    });
    return { entityId: ministry.id, entityType: 'Ministry' };
  }

  private async applyMinistryMember(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
  ) {
    const member = await this.findMember(row);
    const ministryCode = rowVal(row, 'ministrycode', 'ministry code', 'code');
    const ministry = await this.prisma.ministry.findUniqueOrThrow({
      where: { code: ministryCode },
    });

    const existing = await this.prisma.ministryMembership.findUnique({
      where: { ministryId_memberId: { ministryId: ministry.id, memberId: member.id } },
    });
    if (existing && strategy === 'SKIP') {
      throw new BadRequestException('Ministry membership already exists');
    }

    await this.prisma.ministryMembership.upsert({
      where: {
        ministryId_memberId: { ministryId: ministry.id, memberId: member.id },
      },
      create: {
        ministryId: ministry.id,
        memberId: member.id,
        status: MinistryMembershipStatus.ACTIVE,
      },
      update: { status: MinistryMembershipStatus.ACTIVE },
    });
    return { entityId: member.id, entityType: 'MinistryMembership' };
  }

  private async applyLeadership(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
    actorUserId: string,
  ) {
    const member = await this.findMember(row);
    const ministryCode = rowVal(row, 'ministrycode', 'ministry code', 'code');
    const positionName = rowVal(row, 'position', 'positionname', 'position name', 'role');
    const ministry = await this.prisma.ministry.findUniqueOrThrow({
      where: { code: ministryCode },
    });

    let position = await this.prisma.ministryLeadershipPosition.findUnique({
      where: { ministryId_name: { ministryId: ministry.id, name: positionName } },
    });
    if (!position && (strategy === 'MERGE' || strategy === 'REPLACE')) {
      position = await this.prisma.ministryLeadershipPosition.create({
        data: {
          ministryId: ministry.id,
          name: positionName,
          isSystem: false,
          isActive: true,
        },
      });
    }
    if (!position) throw new BadRequestException(`Position ${positionName} not found`);

    const active = await this.prisma.ministryLeadershipAssignment.findFirst({
      where: {
        ministryId: ministry.id,
        memberId: member.id,
        positionId: position.id,
        endedAt: null,
      },
    });
    if (active && strategy === 'SKIP') {
      throw new BadRequestException('Leadership assignment already active');
    }
    if (active && strategy === 'REPLACE') {
      await this.prisma.ministryLeadershipAssignment.update({
        where: { id: active.id },
        data: { endedAt: new Date() },
      });
    }

    const assignment = await this.prisma.ministryLeadershipAssignment.create({
      data: {
        ministryId: ministry.id,
        memberId: member.id,
        positionId: position.id,
        assignedByUserId: actorUserId,
      },
    });
    return { entityId: assignment.id, entityType: 'MinistryLeadershipAssignment' };
  }

  private async applyAsset(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
    actorUserId: string,
  ) {
    const code = rowVal(row, 'code', 'assetcode', 'asset code');
    const name = rowVal(row, 'name', 'assetname', 'asset name');
    const categoryCode = rowVal(row, 'categorycode', 'category code', 'category') || 'GENERAL';
    if (!code || !name) throw new BadRequestException('code and name required');

    let category = await this.prisma.assetCategory.findUnique({
      where: { code: categoryCode },
    });
    if (!category) {
      category = await this.prisma.assetCategory.create({
        data: { code: categoryCode, name: categoryCode, isSystem: false },
      });
    }

    const existing = await this.prisma.asset.findUnique({ where: { code } });
    if (existing && strategy === 'SKIP') {
      throw new BadRequestException('Asset already exists');
    }

    const asset = await this.prisma.asset.upsert({
      where: { code },
      create: {
        code,
        name,
        description: rowVal(row, 'description') || undefined,
        categoryId: category.id,
        createdByUserId: actorUserId,
      },
      update: {
        name,
        description: rowVal(row, 'description') || undefined,
        categoryId: category.id,
      },
    });
    return { entityId: asset.id, entityType: 'Asset' };
  }

  private async applySchedule(
    row: Record<string, unknown>,
    strategy: ImportConflictStrategy,
    actorUserId: string,
  ) {
    const title = rowVal(row, 'title', 'name');
    const templateCode = rowVal(row, 'templatecode', 'template code', 'code');
    const startRaw = rowVal(row, 'startat', 'start at', 'start');
    const endRaw = rowVal(row, 'endat', 'end at', 'end');
    if (!startRaw) throw new BadRequestException('startAt required');

    const startAt = new Date(startRaw);
    const endAt = endRaw ? new Date(endRaw) : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
    const typeRaw = rowVal(row, 'type', 'operationtype').toUpperCase();
    const type: ChurchOperationType =
      typeRaw === 'SPECIAL_EVENT' ? 'SPECIAL_EVENT' : 'SERVICE';

    let templateId: string | undefined;
    if (templateCode) {
      const template = await this.prisma.operationTemplate.findUnique({
        where: { code: templateCode },
      });
      templateId = template?.id;
    }

    const occurrence = await this.prisma.operationOccurrence.create({
      data: {
        templateId,
        type,
        title: title || templateCode || 'Imported schedule',
        startAt,
        endAt,
        status: 'DRAFT',
        createdById: actorUserId,
      },
    });
    return { entityId: occurrence.id, entityType: 'OperationOccurrence' };
  }
}
