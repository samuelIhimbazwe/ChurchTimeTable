import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { ROLES } from '../common/constants/roles';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { MemberNumberService } from '../members/member-number.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSystemUserRolesDto } from './dto/assign-system-user-roles.dto';
import { CreateSystemUserDto } from './dto/create-system-user.dto';
import { ListSystemUsersDto } from './dto/list-system-users.dto';
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto';
import { UpdateSystemUserDto } from './dto/update-system-user.dto';

const userListSelect = {
  id: true,
  email: true,
  isActive: true,
  preferredLanguage: true,
  createdAt: true,
  updatedAt: true,
  member: {
    select: {
      id: true,
      memberNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
      ministry: true,
      status: true,
    },
  },
  userRoles: {
    select: {
      role: { select: { id: true, name: true, description: true } },
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class SystemUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private memberNumberService: MemberNumberService,
  ) {}

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  }

  async list(dto: ListSystemUsersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { skip, take } = paginate(page, limit);
    const q = dto.q?.trim();

    const where: Prisma.UserWhereInput = {};
    if (dto.activeOnly === true) {
      where.isActive = true;
    }
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { member: { firstName: { contains: q } } },
        { member: { lastName: { contains: q } } },
        { member: { memberNumber: { contains: q } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: userListSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginatedResult(
      items.map((u) => this.serializeUser(u)),
      total,
      page,
      limit,
    );
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.serializeUser(user);
  }

  async create(actorUserId: string, dto: CreateSystemUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const roles = await this.resolveRoles(dto.roleNames);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const ministry = dto.ministry ?? 'BOTH';

    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber = await this.memberNumberService.generateMemberNumber(tx);
      return tx.user.create({
        data: {
          email,
          passwordHash,
          preferredLanguage: dto.preferredLanguage ?? 'en',
          member: {
            create: {
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone?.trim() || null,
              ministry,
              status: MemberStatus.ACTIVE,
              onboardingCompleted: true,
              memberNumber,
            },
          },
          userRoles: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        select: userListSelect,
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'SYSTEM_USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: {
        email: user.email,
        roleNames: roles.map((r) => r.name),
      },
    });

    return this.serializeUser(user);
  }

  async update(
    actorUserId: string,
    targetUserId: string,
    dto: UpdateSystemUserDto,
  ) {
    if (actorUserId === targetUserId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const before = await this.requireUser(targetUserId);
    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.preferredLanguage !== undefined
          ? { preferredLanguage: dto.preferredLanguage }
          : {}),
      },
      select: userListSelect,
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'SYSTEM_USER_UPDATED',
      entity: 'User',
      entityId: targetUserId,
      oldValue: {
        isActive: before.isActive,
        preferredLanguage: before.preferredLanguage,
      },
      newValue: {
        isActive: user.isActive,
        preferredLanguage: user.preferredLanguage,
      },
    });

    return this.serializeUser(user);
  }

  async assignRoles(
    actorUserId: string,
    targetUserId: string,
    dto: AssignSystemUserRolesDto,
  ) {
    const before = await this.requireUser(targetUserId);
    const roles = await this.resolveRoles(dto.roleNames);
    const beforeRoleNames = before.userRoles.map((ur) => ur.role.name);

    if (
      dto.mode === 'replace' &&
      beforeRoleNames.includes(ROLES.SUPER_ADMIN) &&
      !roles.some((r) => r.name === ROLES.SUPER_ADMIN)
    ) {
      await this.assertAnotherSuperAdminRemains(targetUserId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.mode === 'replace') {
        await tx.userRole.deleteMany({ where: { userId: targetUserId } });
      }
      for (const role of roles) {
        await tx.userRole.upsert({
          where: {
            userId_roleId: { userId: targetUserId, roleId: role.id },
          },
          create: { userId: targetUserId, roleId: role.id },
          update: {},
        });
      }
    });

    const user = await this.requireUser(targetUserId);
    await this.audit.log({
      userId: actorUserId,
      action: 'SYSTEM_USER_ROLES_ASSIGNED',
      entity: 'User',
      entityId: targetUserId,
      oldValue: { roleNames: beforeRoleNames },
      newValue: {
        roleNames: user.userRoles.map((ur) => ur.role.name),
        mode: dto.mode,
      },
    });

    return this.serializeUser(user);
  }

  async resetPassword(
    actorUserId: string,
    targetUserId: string,
    dto: ResetSystemUserPasswordDto,
  ) {
    await this.requireUser(targetUserId);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'SYSTEM_USER_PASSWORD_RESET',
      entity: 'User',
      entityId: targetUserId,
    });

    return { ok: true };
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async resolveRoles(roleNames: string[]) {
    const unique = [...new Set(roleNames.map((n) => n.trim()).filter(Boolean))];
    if (!unique.length) {
      throw new BadRequestException('At least one role is required');
    }
    const roles = await this.prisma.role.findMany({
      where: { name: { in: unique } },
    });
    if (roles.length !== unique.length) {
      const found = new Set(roles.map((r) => r.name));
      const missing = unique.filter((n) => !found.has(n));
      throw new BadRequestException(`Unknown roles: ${missing.join(', ')}`);
    }
    return roles;
  }

  private async assertAnotherSuperAdminRemains(excludeUserId: string) {
    const others = await this.prisma.userRole.count({
      where: {
        userId: { not: excludeUserId },
        role: { name: ROLES.SUPER_ADMIN },
        user: { isActive: true },
      },
    });
    if (others < 1) {
      throw new ForbiddenException(
        'Cannot remove the last active SUPER_ADMIN account',
      );
    }
  }

  private serializeUser(
    user: Prisma.UserGetPayload<{ select: typeof userListSelect }>,
  ) {
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      member: user.member,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }
}
