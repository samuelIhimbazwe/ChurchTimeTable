import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChoirSponsorRequestKind,
  ChoirSponsorRequestStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirSponsorAccessService } from './choir-sponsor-access.service';
import { MEMBER_PORTAL_AUDIT } from './member-portal.constants';
import { INTERNAL_CHOIR_MEMBERSHIP } from '../common/choir/membership-intake.constants';

@Injectable()
export class ChoirSponsorRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private sponsorAccess: ChoirSponsorAccessService,
  ) {}

  private async memberForUser(userId: string) {
    return this.prisma.member.findUniqueOrThrow({ where: { userId } });
  }

  private async assertNotSingerOfChoir(userId: string, choirId: string) {
    const active = await this.prisma.choirMembership.findFirst({
      where: { userId, choirId, isActive: true },
    });
    if (active) {
      throw new BadRequestException(
        'Active choir members cannot sponsor the same choir. Sing and sponsor must be separate for each choir.',
      );
    }
  }

  async submit(
    userId: string,
    data: {
      choirId: string;
      kind?: ChoirSponsorRequestKind;
      message?: string;
    },
  ) {
    if (INTERNAL_CHOIR_MEMBERSHIP) {
      throw new BadRequestException(
        'Sponsors are invited by choir leadership. Self-serve sponsor applications are closed.',
      );
    }
    const member = await this.memberForUser(userId);
    const choir = await this.prisma.choir.findFirst({
      where: { id: data.choirId, isActive: true, isPublicJoinable: true },
    });
    if (!choir) throw new NotFoundException('Choir not available');

    await this.assertNotSingerOfChoir(userId, data.choirId);

    const activeSponsorship = await this.prisma.choirSponsorship.findFirst({
      where: { memberId: member.id, choirId: data.choirId, active: true },
    });
    if (activeSponsorship) {
      throw new BadRequestException('You already sponsor this choir');
    }

    const pending = await this.prisma.choirSponsorRequest.findFirst({
      where: {
        memberId: member.id,
        choirId: data.choirId,
        status: 'PENDING',
      },
    });
    if (pending) {
      throw new BadRequestException('A pending sponsor request already exists');
    }

    const request = await this.prisma.choirSponsorRequest.create({
      data: {
        memberId: member.id,
        choirId: data.choirId,
        kind: data.kind ?? 'NEW_SPONSOR',
        message: data.message,
      },
      include: {
        choir: { select: { name: true } },
        member: { select: { firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      userId,
      action: MEMBER_PORTAL_AUDIT.SPONSOR_REQUEST_SUBMITTED,
      entity: 'ChoirSponsorRequest',
      entityId: request.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return request;
  }

  async list(
    actorUserId: string,
    filters?: { choirId?: string; status?: ChoirSponsorRequestStatus },
  ) {
    const member = await this.memberForUser(actorUserId);

    if (await this.sponsorAccess.canReview(actorUserId, filters?.choirId)) {
      return this.prisma.choirSponsorRequest.findMany({
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

    return this.prisma.choirSponsorRequest.findMany({
      where: { memberId: member.id },
      include: { choir: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(
    actorUserId: string,
    requestId: string,
    data: {
      status: 'APPROVED' | 'REJECTED';
      reviewNotes?: string;
    },
  ) {
    const request = await this.prisma.choirSponsorRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { member: true, choir: true },
    });

    await this.sponsorAccess.requireReview(actorUserId, request.choirId);

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not reviewable');
    }

    if (data.status === 'APPROVED') {
      await this.assertNotSingerOfChoir(request.member.userId, request.choirId);

      await this.prisma.choirSponsorship.upsert({
        where: {
          memberId_choirId: {
            memberId: request.memberId,
            choirId: request.choirId,
          },
        },
        create: {
          memberId: request.memberId,
          choirId: request.choirId,
          active: true,
          approvedByUserId: actorUserId,
        },
        update: {
          active: true,
          endedAt: null,
          approvedByUserId: actorUserId,
        },
      });
    }

    const updated = await this.prisma.choirSponsorRequest.update({
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
      action: MEMBER_PORTAL_AUDIT.SPONSOR_REQUEST_REVIEWED,
      entity: 'ChoirSponsorRequest',
      entityId: requestId,
      newValue: data as Prisma.InputJsonValue,
    });

    return updated;
  }

  async withdraw(userId: string, requestId: string) {
    const member = await this.memberForUser(userId);
    const request = await this.prisma.choirSponsorRequest.findFirst({
      where: { id: requestId, memberId: member.id },
    });
    if (!request) throw new NotFoundException();
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cannot withdraw');
    }
    return this.prisma.choirSponsorRequest.update({
      where: { id: requestId },
      data: { status: 'WITHDRAWN' },
    });
  }
}
