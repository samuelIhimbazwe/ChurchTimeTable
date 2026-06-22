import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChoirJoinRequestStatus,
  ChoirJoinRequestType,
  NotificationType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { JoinCapabilityResolverService } from '../common/choir/join-capability-resolver.service';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';
import { ChoirContextService } from '../choirs/choir-context.service';
import { MEMBER_PORTAL_AUDIT, YERUSALEMU_CHOIR_CODE } from './member-portal.constants';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { ChoirJoinAccessService } from './choir-join-access.service';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';
import { IndividualWhatsAppService } from '../messaging/individual-whatsapp.service';
import { AppLinkService } from '../messaging/app-link.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChoirJoinRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private joinAccess: ChoirJoinAccessService,
    private joinCapabilities: JoinCapabilityResolverService,
    private rules: ChoirMembershipRulesService,
    private choirContext: ChoirContextService,
    private notify: MemberPortalNotificationsService,
    private individualWhatsApp: IndividualWhatsAppService,
    private appLinks: AppLinkService,
    private notifications: NotificationsService,
  ) {}

  private async memberForUser(userId: string) {
    return this.prisma.member.findUniqueOrThrow({ where: { userId } });
  }

  private async loadCommitteeRoleNames(
    memberId: string | null | undefined,
    choirId: string,
  ): Promise<string[]> {
    if (!memberId) return [];
    const rows = await this.prisma.choirCommitteeMember.findMany({
      where: { memberId, choirId, ...activeChoirCommitteeMemberWhere() },
      include: { role: { select: { name: true } } },
    });
    return rows.map((row) => row.role.name);
  }

  private async assertCanDecideJoin(
    actorUserId: string,
    choirId: string,
  ): Promise<void> {
    await this.joinAccess.requireReview(actorUserId, choirId);

    const resolved = await this.permissions.resolveForUser(actorUserId);
    const auth = await this.joinCapabilities.resolveGrantsToCapabilities(
      actorUserId,
      choirId,
    );

    if (resolved.roles.includes(ROLES.CHOIR_PRESIDENT)) return;
    if (this.joinCapabilities.can(auth, 'choir.member.manage@choir')) return;
    if (
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    ) {
      return;
    }

    const committeeRoles = await this.loadCommitteeRoleNames(
      resolved.memberId,
      choirId,
    );
    if (committeeRoles.includes('president')) return;

    const isVp =
      committeeRoles.includes('vice_president') ||
      resolved.roles.includes(ROLES.CHOIR_VICE_PRESIDENT);

    if (isVp) {
      const choir = await this.prisma.choir.findUnique({
        where: { id: choirId },
        select: { presidentDelegationJoinReview: true },
      });
      if (!choir?.presidentDelegationJoinReview) {
        throw new ForbiddenException(
          'Presidential delegation is required for vice-president join decisions',
        );
      }
      return;
    }
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

    const active = await this.prisma.choirMembership.findFirst({
      where: { userId: member.userId, choirId: data.choirId, isActive: true },
    });
    if (active) {
      throw new BadRequestException('You are already a member of this choir');
    }

    const activeSponsor = await this.prisma.choirSponsorship.findFirst({
      where: { memberId: member.id, choirId: data.choirId, active: true },
    });
    if (activeSponsor) {
      throw new BadRequestException(
        'You sponsor this choir and cannot also join as a singer here',
      );
    }

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

    const otherPending = await this.prisma.choirJoinRequest.findFirst({
      where: {
        memberId: member.id,
        status: { in: ['PENDING', 'NEEDS_INFO'] },
        choirId: { not: data.choirId },
      },
      include: { choir: { select: { name: true, code: true, choirKind: true } } },
    });
    if (otherPending) {
      const targetIsYerusalemu =
        choir.code === YERUSALEMU_CHOIR_CODE || choir.choirKind === 'SPECIAL';
      if (!targetIsYerusalemu) {
        throw new BadRequestException(
          `You already have a pending request for ${otherPending.choir.name}. Cancel that request first before joining another choir. Yerusalemu (morning service) may be requested separately.`,
        );
      }
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

    await this.notifyJoinRequestSubmitted(request);

    return request;
  }

  private async notifyJoinRequestSubmitted(request: {
    id: string;
    choirId: string;
    requestType: ChoirJoinRequestType;
    choir: { name: string };
    member: { firstName: string; lastName: string };
  }) {
    const memberName =
      `${request.member.firstName} ${request.member.lastName}`.trim();
    const actionUrl = this.appLinks.choirJoinRequests(
      request.choirId,
      request.id,
    );

    const reviewers = await this.individualWhatsApp.loadJoinReviewers();
    for (const reviewer of reviewers) {
      await this.notifications.create(
        reviewer.userId,
        NotificationType.GENERAL,
        'New choir join request',
        `${memberName} requested to join ${request.choir.name}.`,
        {
          kind: 'choir_join_request_admin',
          requestId: request.id,
          choirId: request.choirId,
          actionUrl,
        },
        request.choirId,
      );
    }

    void this.individualWhatsApp
      .notifyJoinRequestSubmitted({
        choirId: request.choirId,
        choirName: request.choir.name,
        requestId: request.id,
        memberName,
        requestType: request.requestType,
      })
      .catch(() => undefined);
  }

  async list(actorUserId: string, filters?: { choirId?: string; status?: ChoirJoinRequestStatus }) {
    const member = await this.memberForUser(actorUserId);

    if (await this.joinAccess.canReview(actorUserId, filters?.choirId)) {
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
      assignedRoleId?: string;
    },
  ) {
    const request = await this.prisma.choirJoinRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { member: true, choir: true },
    });

    await this.joinAccess.requireReview(actorUserId, request.choirId);
    await this.assertCanDecideJoin(actorUserId, request.choirId);

    if (request.status !== 'PENDING' && request.status !== 'NEEDS_INFO') {
      throw new BadRequestException('Request is not reviewable');
    }

    if (data.status === 'NEEDS_INFO' && !data.reviewNotes?.trim()) {
      throw new BadRequestException(
        'Add requirements or questions in the review notes when requesting more information',
      );
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
      if (data.assignedRoleId) {
        await this.assignCommitteeRole(
          actorUserId,
          request.choirId,
          request.memberId,
          data.assignedRoleId,
        );
      }
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

    const notifyPromise = this.notify.notifyJoinRequestReviewed({
      member: { userId: request.member.userId },
      choir: updated.choir,
      status: data.status,
    });
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }

    return updated;
  }

  async listPositionRoles(actorUserId: string, choirId: string) {
    await this.joinAccess.requireReview(actorUserId, choirId);
    return this.prisma.choirCommitteeRole.findMany({
      where: { choirId },
      orderBy: { name: 'asc' },
    });
  }

  async assignMemberPosition(
    actorUserId: string,
    data: { choirId: string; memberId: string; roleId: string },
  ) {
    await this.joinAccess.requireReview(actorUserId, data.choirId);

    const member = await this.prisma.member.findUnique({
      where: { id: data.memberId },
      select: { userId: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const membership = await this.prisma.choirMembership.findFirst({
      where: {
        choirId: data.choirId,
        userId: member.userId,
        isActive: true,
      },
    });
    if (!membership) {
      throw new BadRequestException('Member is not active in this choir');
    }

    return this.assignCommitteeRole(
      actorUserId,
      data.choirId,
      data.memberId,
      data.roleId,
    );
  }

  async revokeMemberPosition(
    actorUserId: string,
    data: { choirId: string; memberId: string; roleId: string },
  ) {
    await this.joinAccess.requireReview(actorUserId, data.choirId);

    const assignment = await this.prisma.choirCommitteeMember.findFirst({
      where: {
        choirId: data.choirId,
        memberId: data.memberId,
        roleId: data.roleId,
        ...activeChoirCommitteeMemberWhere(),
      },
    });
    if (!assignment) {
      throw new NotFoundException('Position assignment not found');
    }

    const endedAt = new Date();
    await this.prisma.choirCommitteeMember.update({
      where: { id: assignment.id },
      data: { effectiveEnd: endedAt },
    });

    return {
      removed: true,
      memberId: data.memberId,
      roleId: data.roleId,
      effectiveEnd: endedAt.toISOString(),
    };
  }

  private async assignCommitteeRole(
    actorUserId: string,
    choirId: string,
    memberId: string,
    roleId: string,
  ) {
    const role = await this.prisma.choirCommitteeRole.findFirst({
      where: { id: roleId, choirId },
    });
    if (!role) {
      throw new BadRequestException('Invalid choir position role');
    }

    return this.prisma.choirCommitteeMember.upsert({
      where: {
        choirId_memberId_roleId: { choirId, memberId, roleId: role.id },
      },
      create: {
        choirId,
        memberId,
        roleId: role.id,
        assignedBy: actorUserId,
        effectiveEnd: null,
      },
      update: {
        assignedBy: actorUserId,
        assignedAt: new Date(),
        effectiveEnd: null,
      },
      include: { role: true, member: true },
    });
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
