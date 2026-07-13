import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionStatus,
  MemberStatus,
  MinistryScope,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirSponsorAccessService } from '../member-portal/choir-sponsor-access.service';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { MemberNumberService } from '../members/member-number.service';
import { ROLES } from '../common/constants/roles';
import { AppLinkService } from '../messaging/app-link.service';
import { OnboardingDeliveryService } from '../messaging/onboarding-delivery.service';

function generateTemporaryPassword(): string {
  return randomBytes(6)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(10, 'A');
}

@Injectable()
export class ChoirSponsorsService {
  constructor(
    private prisma: PrismaService,
    private sponsorAccess: ChoirSponsorAccessService,
    private audit: AuditService,
    private memberNumberService: MemberNumberService,
    private ministryScope: MemberMinistryScopeService,
    private appLinks: AppLinkService,
    private onboardingDelivery: OnboardingDeliveryService,
  ) {}

  async listForChoir(actorUserId: string, choirId: string) {
    await this.sponsorAccess.requireReview(actorUserId, choirId);

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true, name: true },
    });
    if (!choir) throw new NotFoundException('Choir not found');

    const sponsorships = await this.prisma.choirSponsorship.findMany({
      where: { choirId, active: true },
      orderBy: { startedAt: 'asc' },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    const memberIds = sponsorships.map((s) => s.memberId);
    const confirmedRows =
      memberIds.length === 0
        ? []
        : await this.prisma.contributionRecord.findMany({
            where: {
              choirId,
              familyId: null,
              memberId: { in: memberIds },
              status: ContributionStatus.CONFIRMED,
            },
            select: {
              memberId: true,
              amount: true,
              confirmedAmount: true,
              claimedAmount: true,
              confirmedAt: true,
              createdAt: true,
            },
          });

    const byMember = new Map<
      string,
      { total: number; giftCount: number; lastGiftAt: string | null }
    >();
    for (const row of confirmedRows) {
      const amount = Number(
        row.confirmedAmount ?? row.claimedAmount ?? row.amount ?? 0,
      );
      const prev = byMember.get(row.memberId) ?? {
        total: 0,
        giftCount: 0,
        lastGiftAt: null as string | null,
      };
      const at = (row.confirmedAt ?? row.createdAt).toISOString();
      byMember.set(row.memberId, {
        total: prev.total + (Number.isFinite(amount) ? amount : 0),
        giftCount: prev.giftCount + 1,
        lastGiftAt:
          !prev.lastGiftAt || at > prev.lastGiftAt ? at : prev.lastGiftAt,
      });
    }

    const pendingRows =
      memberIds.length === 0
        ? []
        : await this.prisma.contributionRecord.groupBy({
            by: ['memberId'],
            where: {
              choirId,
              familyId: null,
              memberId: { in: memberIds },
              status: ContributionStatus.SUBMITTED,
            },
            _count: { _all: true },
          });
    const pendingByMember = new Map(
      pendingRows.map((r) => [r.memberId, r._count._all]),
    );

    const sponsors = sponsorships.map((s) => {
      const giving = byMember.get(s.memberId) ?? {
        total: 0,
        giftCount: 0,
        lastGiftAt: null,
      };
      return {
        sponsorshipId: s.id,
        memberId: s.memberId,
        firstName: s.member.firstName,
        lastName: s.member.lastName,
        email: s.member.user?.email ?? null,
        phone: s.member.phone,
        startedAt: s.startedAt.toISOString(),
        confirmedTotal: giving.total,
        confirmedGiftCount: giving.giftCount,
        lastGiftAt: giving.lastGiftAt,
        pendingGiftCount: pendingByMember.get(s.memberId) ?? 0,
      };
    });

    const totals = {
      sponsorCount: sponsors.length,
      confirmedTotal: sponsors.reduce((sum, s) => sum + s.confirmedTotal, 0),
      pendingGiftCount: sponsors.reduce(
        (sum, s) => sum + s.pendingGiftCount,
        0,
      ),
    };

    return { choirId, choirName: choir.name, sponsors, totals };
  }

  async provisionSponsor(
    actorUserId: string,
    data: {
      choirId: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ) {
    await this.sponsorAccess.requireReview(actorUserId, data.choirId);

    const email = data.email.trim().toLowerCase();
    const choir = await this.prisma.choir.findFirst({
      where: { id: data.choirId, isActive: true },
    });
    if (!choir) throw new NotFoundException('Choir not found');

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });

    if (existingUser) {
      const singer = await this.prisma.choirMembership.findFirst({
        where: {
          userId: existingUser.id,
          choirId: data.choirId,
          isActive: true,
        },
      });
      if (singer) {
        throw new BadRequestException(
          'This person is already an active singer in this choir. Sponsors and singers must be separate.',
        );
      }
      if (!existingUser.member) {
        throw new BadRequestException('Account has no member profile');
      }

      const existing = await this.prisma.choirSponsorship.findUnique({
        where: {
          memberId_choirId: {
            memberId: existingUser.member.id,
            choirId: data.choirId,
          },
        },
      });
      if (existing?.active) {
        throw new ConflictException('Already an active sponsor of this choir');
      }

      await this.prisma.choirSponsorship.upsert({
        where: {
          memberId_choirId: {
            memberId: existingUser.member.id,
            choirId: data.choirId,
          },
        },
        create: {
          memberId: existingUser.member.id,
          choirId: data.choirId,
          active: true,
          approvedByUserId: actorUserId,
        },
        update: {
          active: true,
          endedAt: null,
          approvedByUserId: actorUserId,
          startedAt: new Date(),
        },
      });

      await this.ministryScope.syncMinistryScope(existingUser.member.id);
      await this.audit.log({
        userId: actorUserId,
        action: 'CHOIR_SPONSOR_PROVISIONED_EXISTING',
        entity: 'ChoirSponsorship',
        entityId: data.choirId,
        newValue: { email, choirId: data.choirId },
      });

      return {
        email,
        memberId: existingUser.member.id,
        existingAccount: true,
        temporaryPassword: null as string | null,
        message:
          'Existing account was invited as a sponsor. Share the sponsor dashboard login separately.',
      };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const memberRole = await this.prisma.role.findUnique({
      where: { name: ROLES.MEMBER },
    });
    if (!memberRole) {
      throw new BadRequestException('System roles not seeded');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber =
        await this.memberNumberService.generateMemberNumber(tx);
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          mustChangePassword: true,
          termsAcceptedAt: new Date(),
          member: {
            create: {
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              phone: data.phone?.trim() || null,
              ministry: MinistryScope.CHOIR,
              status: MemberStatus.ACTIVE,
              onboardingCompleted: false,
              memberNumber,
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });

      await tx.choirSponsorship.create({
        data: {
          memberId: created.member!.id,
          choirId: data.choirId,
          active: true,
          approvedByUserId: actorUserId,
        },
      });

      return created;
    });

    await this.ministryScope.syncMinistryScope(user.member!.id);

    const delivery = await this.onboardingDelivery.deliverCredentials({
      email,
      phone: data.phone,
      firstName: data.firstName,
      temporaryPassword,
      loginUrl: `${this.appLinks.baseUrl()}/login`,
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_SPONSOR_PROVISIONED',
      entity: 'User',
      entityId: user.id,
      newValue: { email, choirId: data.choirId, delivery },
    });

    return {
      email,
      memberId: user.member!.id,
      existingAccount: false,
      temporaryPassword,
      message:
        'Share these credentials securely. The sponsor must change their password on first login, then open the sponsor dashboard.',
      delivery,
    };
  }
}
