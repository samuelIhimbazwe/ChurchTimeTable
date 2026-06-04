import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { MEMBER_PORTAL_AUDIT } from './member-portal.constants';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';
import { ProtocolMembershipService } from './protocol-membership.service';

@Injectable()
export class ProtocolInvitationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private notify: MemberPortalNotificationsService,
    private protocolMembership: ProtocolMembershipService,
  ) {}

  private canInvite(perms: string[]) {
    return (
      hasEffectivePermission(perms, PERMISSIONS.PROTOCOL_INVITE) ||
      hasEffectivePermission(perms, PERMISSIONS.PROTOCOL_MANAGE)
    );
  }

  async send(
    actorUserId: string,
    data: { memberId: string; message?: string; expiresInDays?: number },
  ) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!this.canInvite(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    const inviter = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 14));

    const invitation = await this.prisma.protocolInvitation.create({
      data: {
        memberId: data.memberId,
        invitedById: inviter.id,
        message: data.message,
        expiresAt,
      },
      include: {
        member: { select: { firstName: true, lastName: true, userId: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MEMBER_PORTAL_AUDIT.PROTOCOL_INVITATION_SENT,
      entity: 'ProtocolInvitation',
      entityId: invitation.id,
      newValue: { memberId: data.memberId } as Prisma.InputJsonValue,
    });

    void this.notify.notifyProtocolInvitation(invitation);

    return invitation;
  }

  async listMine(userId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    await this.expireStale(member.id);
    return this.prisma.protocolInvitation.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async listSent(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!this.canInvite(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return this.prisma.protocolInvitation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        member: { select: { firstName: true, lastName: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private async expireStale(memberId: string) {
    await this.prisma.protocolInvitation.updateMany({
      where: {
        memberId,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }

  async respond(
    userId: string,
    invitationId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const invitation = await this.prisma.protocolInvitation.findFirst({
      where: { id: invitationId, memberId: member.id },
    });
    if (!invitation) throw new NotFoundException();
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is not pending');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.protocolInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation expired');
    }

    const updated = await this.prisma.protocolInvitation.update({
      where: { id: invitationId },
      data: { status, respondedAt: new Date() },
    });

    if (status === 'ACCEPTED') {
      await this.protocolMembership.ensureProtocolMembership(member.id);
    }

    await this.audit.log({
      userId,
      action: MEMBER_PORTAL_AUDIT.PROTOCOL_INVITATION_RESPONDED,
      entity: 'ProtocolInvitation',
      entityId: invitationId,
      newValue: { status } as Prisma.InputJsonValue,
    });

    return updated;
  }
}
