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
import { ProtocolMembershipService } from './protocol-membership.service';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';

@Injectable()
export class ProtocolClaimsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private protocolMembership: ProtocolMembershipService,
    private notify: MemberPortalNotificationsService,
  ) {}

  private canReview(perms: string[]) {
    return (
      hasEffectivePermission(perms, PERMISSIONS.PROTOCOL_CLAIM_REVIEW) ||
      hasEffectivePermission(perms, PERMISSIONS.PROTOCOL_MANAGE)
    );
  }

  async submit(userId: string, message?: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const existing = await this.prisma.protocolMembershipClaim.findFirst({
      where: {
        memberId: member.id,
        status: { in: ['PENDING'] },
      },
    });
    if (existing) {
      throw new BadRequestException('A pending claim already exists');
    }
    if (await this.protocolMembership.isProtocolMember(member.id)) {
      throw new BadRequestException('Already a protocol member');
    }

    const claim = await this.prisma.protocolMembershipClaim.create({
      data: { memberId: member.id, message },
    });

    await this.audit.log({
      userId,
      action: MEMBER_PORTAL_AUDIT.PROTOCOL_CLAIM_SUBMITTED,
      entity: 'ProtocolMembershipClaim',
      entityId: claim.id,
      newValue: { message } as Prisma.InputJsonValue,
    });

    return claim;
  }

  async list(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (this.canReview(resolved.permissions)) {
      return this.prisma.protocolMembershipClaim.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    return this.prisma.protocolMembershipClaim.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(
    actorUserId: string,
    claimId: string,
    data: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string },
  ) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!this.canReview(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    const reviewer = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });

    const claim = await this.prisma.protocolMembershipClaim.findUniqueOrThrow({
      where: { id: claimId },
      include: { member: true },
    });
    if (claim.status !== 'PENDING') {
      throw new BadRequestException('Claim is not pending');
    }

    if (data.status === 'APPROVED') {
      await this.protocolMembership.ensureProtocolMembership(claim.memberId);
    }

    const updated = await this.prisma.protocolMembershipClaim.update({
      where: { id: claimId },
      data: {
        status: data.status,
        reviewNotes: data.reviewNotes,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
      },
      include: { member: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MEMBER_PORTAL_AUDIT.PROTOCOL_CLAIM_REVIEWED,
      entity: 'ProtocolMembershipClaim',
      entityId: claimId,
      newValue: data as Prisma.InputJsonValue,
    });

    const notifyPromise = this.notify.notifyProtocolClaimReviewed({
      member: { userId: claim.member.userId },
      status: data.status,
    });
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }

    return updated;
  }
}
