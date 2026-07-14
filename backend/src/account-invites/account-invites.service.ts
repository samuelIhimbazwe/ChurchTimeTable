import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountInviteStatus,
  AccountInviteType,
  MemberStatus,
  MinistryScope,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ROLES } from '../common/constants/roles';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { MemberNumberService } from '../members/member-number.service';
import { AppLinkService } from '../messaging/app-link.service';
import { OnboardingDeliveryService } from '../messaging/onboarding-delivery.service';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountInviteDto } from './dto/create-account-invite.dto';
import { ListAccountInvitesDto } from './dto/list-account-invites.dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CHOIR_OFFICER_ROLES = new Set<string>([
  ROLES.CHOIR_PRESIDENT,
  ROLES.CHOIR_ADMIN,
  ROLES.CHOIR_VICE_PRESIDENT,
]);

const PROTOCOL_INVITE_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.PROTOCOL_ADMIN,
  ROLES.PROTOCOL_LEADER,
]);

const DUAL_INVITE_ROLES = new Set<string>([ROLES.SUPER_ADMIN, ROLES.CHURCH_ADMIN]);

@Injectable()
export class AccountInvitesService {
  private readonly logger = new Logger(AccountInvitesService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private appLinks: AppLinkService,
    private memberNumberService: MemberNumberService,
    private ministryScope: MemberMinistryScopeService,
    private onboardingDelivery: OnboardingDeliveryService,
  ) {}

  async create(actorUserId: string, dto: CreateAccountInviteDto) {
    const email = dto.email.trim().toLowerCase();
    const inviteDto =
      dto.inviteType === AccountInviteType.CHOIR ||
      dto.inviteType === AccountInviteType.DUAL
        ? {
            ...dto,
            choirId: await this.resolveInviteChoirId(actorUserId, dto.choirId),
          }
        : dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException({
        code: 'CONFLICT',
        messageKey: 'EMAIL_ALREADY_REGISTERED',
      });
    }

    await this.assertCanCreateInvite(
      actorUserId,
      inviteDto.inviteType,
      inviteDto.choirId,
    );

    if (
      inviteDto.inviteType === AccountInviteType.CHOIR ||
      inviteDto.inviteType === AccountInviteType.DUAL
    ) {
      if (!inviteDto.choirId) {
        throw new BadRequestException('choirId is required for choir invites');
      }
      const choir = await this.prisma.choir.findFirst({
        where: { id: inviteDto.choirId, isActive: true },
      });
      if (!choir) {
        throw new NotFoundException(
          'Choir not found. Open member onboarding from your choir dashboard, or ask an admin to run demo seed on the server.',
        );
      }
    }

    let assignedRoleId: string | null = null;
    if (inviteDto.inviteType === AccountInviteType.CHOIR) {
      if (!inviteDto.assignedRoleId) {
        throw new BadRequestException(
          'assignedRoleId is required for choir officer invites',
        );
      }
      const role = await this.prisma.choirCommitteeRole.findFirst({
        where: { id: inviteDto.assignedRoleId, choirId: inviteDto.choirId! },
      });
      if (!role) {
        throw new BadRequestException('Invalid choir position role');
      }
      if (role.name === 'choir_member') {
        throw new BadRequestException(
          'Regular members are added via account provisioning, not invite links',
        );
      }
      assignedRoleId = role.id;
    }

    let assignedProtocolRoleId: string | null = null;
    if (dto.inviteType === AccountInviteType.PROTOCOL) {
      if (!dto.assignedProtocolRoleId) {
        throw new BadRequestException(
          'assignedProtocolRoleId is required for protocol officer invites',
        );
      }
      const role = await this.prisma.protocolCommitteeRole.findFirst({
        where: { id: dto.assignedProtocolRoleId, ministryId: 'protocol-ministry' },
      });
      if (!role) {
        throw new BadRequestException('Invalid protocol position role');
      }
      assignedProtocolRoleId = role.id;
    }

    const pending = await this.prisma.accountInvite.findFirst({
      where: { email, status: AccountInviteStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException({
        code: 'CONFLICT',
        messageKey: 'INVITE_ALREADY_PENDING',
      });
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invite = await this.prisma.accountInvite.create({
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        inviteType: dto.inviteType,
        choirId: inviteDto.choirId ?? null,
        assignedRoleId,
        assignedProtocolRoleId,
        tokenHash,
        expiresAt,
        invitedByUserId: actorUserId,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        assignedRole: { select: { id: true, name: true } },
        assignedProtocolRole: { select: { id: true, name: true } },
      },
    });

    const inviteUrl = this.appLinks.acceptInvite(rawToken);
    const whatsappMessage = this.buildWhatsAppMessage(invite, inviteUrl);
    await this.deliverInviteLink(
      email,
      invite.phone,
      invite.firstName,
      invite.inviteType,
      inviteUrl,
      whatsappMessage,
    );

    await this.audit.log({
      userId: actorUserId,
      action: 'ACCOUNT_INVITE_CREATED',
      entity: 'AccountInvite',
      entityId: invite.id,
      newValue: { inviteType: invite.inviteType, email },
    });

    return this.serializeInvite(invite, {
      inviteUrl: this.shouldExposeDevLink() ? inviteUrl : undefined,
      whatsappMessage: this.buildWhatsAppMessage(invite, inviteUrl),
    });
  }

  async list(actorUserId: string, dto: ListAccountInvitesDto) {
    await this.assertCanListInvites(actorUserId);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.AccountInviteWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.inviteType) where.inviteType = dto.inviteType;

    const [items, total] = await Promise.all([
      this.prisma.accountInvite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          choir: { select: { id: true, name: true, code: true } },
          invitedBy: {
            select: {
              id: true,
              email: true,
              member: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.accountInvite.count({ where }),
    ]);

    return paginatedResult(
      items.map((item) => this.serializeInvite(item)),
      total,
      page,
      limit,
    );
  }

  async revoke(actorUserId: string, inviteId: string) {
    const invite = await this.prisma.accountInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    await this.assertCanCreateInvite(
      actorUserId,
      invite.inviteType,
      invite.choirId ?? undefined,
    );
    if (invite.status !== AccountInviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be revoked');
    }

    const updated = await this.prisma.accountInvite.update({
      where: { id: inviteId },
      data: {
        status: AccountInviteStatus.REVOKED,
        revokedAt: new Date(),
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        assignedRole: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'ACCOUNT_INVITE_REVOKED',
      entity: 'AccountInvite',
      entityId: inviteId,
    });

    return this.serializeInvite(updated);
  }

  async resend(actorUserId: string, inviteId: string) {
    const invite = await this.prisma.accountInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    await this.assertCanCreateInvite(
      actorUserId,
      invite.inviteType,
      invite.choirId ?? undefined,
    );
    if (invite.status !== AccountInviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be resent');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const updated = await this.prisma.accountInvite.update({
      where: { id: inviteId },
      data: { tokenHash, expiresAt },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        assignedRole: { select: { id: true, name: true } },
        assignedProtocolRole: { select: { id: true, name: true } },
      },
    });

    const inviteUrl = this.appLinks.acceptInvite(rawToken);
    const whatsappMessage = this.buildWhatsAppMessage(updated, inviteUrl);
    await this.deliverInviteLink(
      invite.email,
      invite.phone,
      invite.firstName,
      invite.inviteType,
      inviteUrl,
      whatsappMessage,
    );

    await this.audit.log({
      userId: actorUserId,
      action: 'ACCOUNT_INVITE_RESENT',
      entity: 'AccountInvite',
      entityId: inviteId,
    });

    return this.serializeInvite(updated, {
      inviteUrl: this.shouldExposeDevLink() ? inviteUrl : undefined,
      whatsappMessage: this.buildWhatsAppMessage(updated, inviteUrl),
    });
  }

  async previewToken(token: string) {
    const invite = await this.findValidInviteRecord(token);
    if (!invite) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        messageKey: 'INVITE_TOKEN_INVALID',
      });
    }

    return {
      valid: true,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      inviteType: invite.inviteType,
      choir: invite.choir,
      assignedRole: invite.assignedRole
        ? { id: invite.assignedRole.id, name: invite.assignedRole.name }
        : null,
      assignedProtocolRole: invite.assignedProtocolRole
        ? {
            id: invite.assignedProtocolRole.id,
            name: invite.assignedProtocolRole.name,
          }
        : null,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async acceptInvite(
    token: string,
    password: string,
    acceptedTerms: boolean,
  ): Promise<{ userId: string }> {
    if (!acceptedTerms) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        messageKey: 'TERMS_NOT_ACCEPTED',
      });
    }

    const invite = await this.findValidInviteRecord(token);
    if (!invite) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        messageKey: 'INVITE_TOKEN_INVALID',
      });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new ConflictException({
        code: 'CONFLICT',
        messageKey: 'EMAIL_ALREADY_REGISTERED',
      });
    }

    const memberRole = await this.prisma.role.findUnique({
      where: { name: ROLES.MEMBER },
    });
    if (!memberRole) {
      throw new BadRequestException('System roles not seeded');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ministry = this.initialMinistryScope(invite.inviteType);

    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber = await this.memberNumberService.generateMemberNumber(tx);
      const created = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          mustChangePassword: true,
          termsAcceptedAt: new Date(),
          member: {
            create: {
              firstName: invite.firstName,
              lastName: invite.lastName,
              phone: invite.phone,
              ministry,
              status: MemberStatus.ACTIVE,
              onboardingCompleted: false,
              memberNumber,
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });

      if (
        invite.inviteType === AccountInviteType.CHOIR ||
        invite.inviteType === AccountInviteType.DUAL
      ) {
        await tx.choirMembership.create({
          data: {
            userId: created.id,
            choirId: invite.choirId!,
            role: ROLES.MEMBER,
            isActive: true,
          },
        });

        if (invite.assignedRoleId && created.member) {
          await tx.choirCommitteeMember.upsert({
            where: {
              choirId_memberId_roleId: {
                choirId: invite.choirId!,
                memberId: created.member.id,
                roleId: invite.assignedRoleId,
              },
            },
            create: {
              choirId: invite.choirId!,
              memberId: created.member.id,
              roleId: invite.assignedRoleId,
              assignedBy: invite.invitedByUserId,
              effectiveEnd: null,
            },
            update: {
              assignedBy: invite.invitedByUserId,
              assignedAt: new Date(),
              effectiveEnd: null,
            },
          });
        }
      }

      if (
        invite.inviteType === AccountInviteType.PROTOCOL ||
        invite.inviteType === AccountInviteType.DUAL
      ) {
        const unit = await tx.operationalUnit.findFirstOrThrow({
          where: { code: 'PROTOCOL_TEAM' },
        });
        await tx.operationalUnitMembership.create({
          data: {
            memberId: created.member!.id,
            operationalUnitId: unit.id,
            status: 'ACTIVE',
          },
        });

        if (invite.assignedProtocolRoleId && created.member) {
          await tx.protocolCommitteeMember.upsert({
            where: {
              ministryId_memberId_roleId: {
                ministryId: 'protocol-ministry',
                memberId: created.member.id,
                roleId: invite.assignedProtocolRoleId,
              },
            },
            create: {
              ministryId: 'protocol-ministry',
              memberId: created.member.id,
              roleId: invite.assignedProtocolRoleId,
              assignedBy: invite.invitedByUserId,
            },
            update: {
              assignedBy: invite.invitedByUserId,
              assignedAt: new Date(),
            },
          });
        }
      }

      await tx.accountInvite.update({
        where: { id: invite.id },
        data: {
          status: AccountInviteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return created;
    });

    await this.ministryScope.syncMinistryScope(user.member!.id);

    await this.audit.log({
      userId: user.id,
      action: 'ACCOUNT_INVITE_ACCEPTED',
      entity: 'AccountInvite',
      entityId: invite.id,
    });

    return { userId: user.id };
  }

  private async findValidInviteRecord(token: string) {
    const tokenHash = this.hashToken(token.trim());
    const invite = await this.prisma.accountInvite.findUnique({
      where: { tokenHash },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        assignedRole: { select: { id: true, name: true } },
        assignedProtocolRole: { select: { id: true, name: true } },
      },
    });

    if (
      !invite ||
      invite.status !== AccountInviteStatus.PENDING ||
      invite.expiresAt.getTime() <= Date.now()
    ) {
      if (
        invite &&
        invite.status === AccountInviteStatus.PENDING &&
        invite.expiresAt.getTime() <= Date.now()
      ) {
        await this.prisma.accountInvite.update({
          where: { id: invite.id },
          data: { status: AccountInviteStatus.EXPIRED },
        });
      }
      return null;
    }

    return invite;
  }

  private initialMinistryScope(type: AccountInviteType): MinistryScope {
    switch (type) {
      case AccountInviteType.CHOIR:
        return MinistryScope.CHOIR;
      case AccountInviteType.PROTOCOL:
        return MinistryScope.PROTOCOL;
      case AccountInviteType.DUAL:
        return MinistryScope.BOTH;
    }
  }

  private async assertCanListInvites(actorUserId: string) {
    const roles = await this.getUserRoles(actorUserId);
    const canList =
      roles.some((r) => DUAL_INVITE_ROLES.has(r)) ||
      roles.some((r) => PROTOCOL_INVITE_ROLES.has(r)) ||
      (await this.hasChoirOfficerMembership(actorUserId));
    if (!canList) {
      throw new ForbiddenException('Not allowed to manage invites');
    }
  }

  private async resolveInviteChoirId(
    actorUserId: string,
    choirId?: string,
  ): Promise<string> {
    const trimmed = choirId?.trim();
    if (trimmed) {
      const direct = await this.prisma.choir.findFirst({
        where: { id: trimmed, isActive: true },
        select: { id: true },
      });
      if (direct) return direct.id;
    }

    const actorMembership = await this.prisma.choirMembership.findFirst({
      where: { userId: actorUserId, isActive: true },
      orderBy: { joinedAt: 'asc' },
      select: { choirId: true },
    });
    if (actorMembership) {
      const fallback = await this.prisma.choir.findFirst({
        where: { id: actorMembership.choirId, isActive: true },
        select: { id: true },
      });
      if (fallback) return fallback.id;
    }

    throw new NotFoundException(
      'Choir not found. Run demo seed on the API server (npm run prisma:seed:pilot), then retry from your choir dashboard.',
    );
  }

  private async assertCanCreateInvite(
    actorUserId: string,
    inviteType: AccountInviteType,
    choirId?: string,
  ) {
    const roles = await this.getUserRoles(actorUserId);

    if (inviteType === AccountInviteType.DUAL) {
      if (!roles.some((r) => DUAL_INVITE_ROLES.has(r))) {
        throw new ForbiddenException('Only platform admins can send dual invites');
      }
      return;
    }

    if (inviteType === AccountInviteType.PROTOCOL) {
      if (!roles.some((r) => PROTOCOL_INVITE_ROLES.has(r))) {
        throw new ForbiddenException('Not allowed to send protocol invites');
      }
      return;
    }

    if (roles.some((r) => DUAL_INVITE_ROLES.has(r))) {
      return;
    }

    if (!choirId) {
      throw new BadRequestException('choirId is required');
    }

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId: actorUserId, choirId } },
    });
    if (
      !membership?.isActive ||
      !CHOIR_OFFICER_ROLES.has(membership.role)
    ) {
      throw new ForbiddenException('Not allowed to invite for this choir');
    }
  }

  private async hasChoirOfficerMembership(userId: string): Promise<boolean> {
    const count = await this.prisma.choirMembership.count({
      where: {
        userId,
        isActive: true,
        role: { in: [...CHOIR_OFFICER_ROLES] },
      },
    });
    return count > 0;
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { name: true } } },
    });
    return rows.map((row) => row.role.name);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async deliverInviteLink(
    email: string,
    phone: string | null | undefined,
    firstName: string,
    inviteType: AccountInviteType,
    inviteUrl: string,
    body: string,
  ) {
    const scope =
      inviteType === AccountInviteType.DUAL
        ? 'choir and protocol'
        : inviteType === AccountInviteType.CHOIR
          ? 'choir'
          : 'protocol team';
    const subject = `Invitation to join ${scope} on Church CMMS`;
    const delivery = await this.onboardingDelivery.deliverInvite({
      email,
      phone,
      subject,
      body,
    });
    if (
      delivery.email !== 'sent' &&
      delivery.whatsapp !== 'sent' &&
      delivery.sms !== 'sent'
    ) {
      this.logger.log(`Account invite link for ${email}: ${inviteUrl}`);
    }
  }

  private shouldExposeDevLink(): boolean {
    return (
      process.env.INVITE_EXPOSE_LINK === 'true' ||
      process.env.PILOT_EXPOSE_INVITE_LINKS === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development'
    );
  }

  private buildWhatsAppMessage(
    invite: {
      firstName: string;
      lastName: string;
      inviteType: AccountInviteType;
      choir?: { name: string } | null;
      assignedRole?: { id: string; name: string } | null;
      assignedProtocolRole?: { id: string; name: string } | null;
    },
    inviteUrl: string,
  ): string {
    const name = `${invite.firstName} ${invite.lastName}`.trim();
    const scope =
      invite.inviteType === AccountInviteType.DUAL
        ? 'choir and protocol'
        : invite.inviteType === AccountInviteType.CHOIR
          ? `${invite.choir?.name ?? 'choir'}${invite.assignedRole ? ` as ${invite.assignedRole.name.replace(/_/g, ' ')}` : ''}`
          : `protocol team${invite.assignedProtocolRole ? ` as ${invite.assignedProtocolRole.name.replace(/^protocol_/, '').replace(/_/g, ' ')}` : ''}`;
    return `Hello ${name}, you are invited to join ${scope} on Church CMMS. Set your password here: ${inviteUrl}`;
  }

  private serializeInvite(
    invite: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      inviteType: AccountInviteType;
      status: AccountInviteStatus;
      expiresAt: Date;
      acceptedAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
      choir?: { id: string; name: string; code: string } | null;
      assignedRole?: { id: string; name: string } | null;
      assignedProtocolRole?: { id: string; name: string } | null;
      invitedBy?: {
        id: string;
        email: string;
        member: { firstName: string; lastName: string } | null;
      };
    },
    extras?: { inviteUrl?: string; whatsappMessage?: string },
  ) {
    return {
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      phone: invite.phone,
      inviteType: invite.inviteType,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      revokedAt: invite.revokedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
      choir: invite.choir ?? null,
      assignedRole: invite.assignedRole ?? null,
      assignedProtocolRole: invite.assignedProtocolRole ?? null,
      invitedBy: invite.invitedBy
        ? {
            id: invite.invitedBy.id,
            email: invite.invitedBy.email,
            name: invite.invitedBy.member
              ? `${invite.invitedBy.member.firstName} ${invite.invitedBy.member.lastName}`.trim()
              : invite.invitedBy.email,
          }
        : undefined,
      ...extras,
    };
  }
}
