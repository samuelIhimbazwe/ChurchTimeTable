import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChoirJoinRequestStatus,
  ChoirJoinRequestType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { ChoirContextService } from '../choirs/choir-context.service';
import { MEMBER_PORTAL_AUDIT } from './member-portal.constants';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';

@Injectable()
export class ChoirJoinRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private rules: ChoirMembershipRulesService,
    private choirContext: ChoirContextService,
    private notify: MemberPortalNotificationsService,
  ) {}

  private async memberForUser(userId: string) {
    return this.prisma.member.findUniqueOrThrow({ where: { userId } });
  }

  private canReview(perms: string[]) {
    return (
      hasEffectivePermission(perms, PERMISSIONS.CHOIR_JOIN_REVIEW) ||
      hasEffectivePermission(perms, PERMISSIONS.CHOIR_OPERATIONS_MANAGE) ||
      hasEffectivePermission(perms, PERMISSIONS.MEMBER_MANAGE)
    );
  }

  async submit(
    userId: string,
    data: {
      choirId: string;
      requestType?: ChoirJoinRequestType;
      reason?: string;
    },
  ) {
    const member = await this.memberForUser(userId);
    const choir = await this.prisma.choir.findFirst({
      where: { id: data.choirId, isActive: true, isPublicJoinable: true },
    });
    if (!choir) throw new NotFoundException('Choir not available');

    const pending = await this.prisma.choirJoinRequest.findFirst({
      where: {
        memberId: member.id,
        choirId: data.choirId,
        status: { in: ['PENDING', 'NEEDS_INFO'] },
      },
    });
    if (pending) {
      throw new BadRequestException('A pending request already exists');
    }

    await this.rules.validateNewMembership(userId, data.choirId);

    const request = await this.prisma.choirJoinRequest.create({
      data: {
        memberId: member.id,
        choirId: data.choirId,
        requestType: data.requestType ?? 'PERMANENT_MEMBER',
        reason: data.reason,
      },
      include: {
        choir: { select: { name: true } },
        member: { select: { firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      userId,
      action: MEMBER_PORTAL_AUDIT.JOIN_REQUEST_SUBMITTED,
      entity: 'ChoirJoinRequest',
      entityId: request.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return request;
  }

  async list(actorUserId: string, filters?: { choirId?: string; status?: ChoirJoinRequestStatus }) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const member = await this.memberForUser(actorUserId);

    if (this.canReview(resolved.permissions)) {
      return this.prisma.choirJoinRequest.findMany({
        where: {
          ...(filters?.choirId ? { choirId: filters.choirId } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
        },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          choir: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    return this.prisma.choirJoinRequest.findMany({
      where: { memberId: member.id },
      include: { choir: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(
    actorUserId: string,
    requestId: string,
    data: {
      status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
      reviewNotes?: string;
    },
  ) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!this.canReview(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const request = await this.prisma.choirJoinRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { member: true, choir: true },
    });

    if (request.status !== 'PENDING' && request.status !== 'NEEDS_INFO') {
      throw new BadRequestException('Request is not reviewable');
    }

    if (data.status === 'APPROVED') {
      await this.rules.validateNewMembership(
        request.member.userId,
        request.choirId,
      );
      await this.choirContext.ensureMembership(
        request.member.userId,
        request.choirId,
        'MEMBER',
      );
    }

    const updated = await this.prisma.choirJoinRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        reviewNotes: data.reviewNotes,
        reviewedByUserId: actorUserId,
        reviewedAt: new Date(),
      },
      include: { choir: true, member: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MEMBER_PORTAL_AUDIT.JOIN_REQUEST_REVIEWED,
      entity: 'ChoirJoinRequest',
      entityId: requestId,
      newValue: data as Prisma.InputJsonValue,
    });

    void this.notify.notifyJoinRequestReviewed({
      member: { userId: request.member.userId },
      choir: updated.choir,
      status: data.status,
    });

    return updated;
  }

  async withdraw(userId: string, requestId: string) {
    const member = await this.memberForUser(userId);
    const request = await this.prisma.choirJoinRequest.findFirst({
      where: { id: requestId, memberId: member.id },
    });
    if (!request) throw new NotFoundException();
    if (request.status !== 'PENDING' && request.status !== 'NEEDS_INFO') {
      throw new BadRequestException('Cannot withdraw');
    }
    return this.prisma.choirJoinRequest.update({
      where: { id: requestId },
      data: { status: 'WITHDRAWN' },
    });
  }
}
