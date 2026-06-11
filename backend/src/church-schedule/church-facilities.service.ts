import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import type { UpsertFacilityDto } from './dto/upsert-facility.dto';

@Injectable()
export class ChurchFacilitiesService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertView(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_FACILITY_VIEW)
    ) {
      throw new ForbiddenException('Facility catalog access denied');
    }
    return resolved;
  }

  private async assertManage(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (
      !hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHURCH_FACILITY_MANAGE,
      )
    ) {
      throw new ForbiddenException('Facility management denied');
    }
    return resolved;
  }

  async list(actorUserId: string, includeInactive = false) {
    await this.assertView(actorUserId);
    return this.prisma.churchFacility.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(actorUserId: string, dto: UpsertFacilityDto) {
    await this.assertManage(actorUserId);
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.churchFacility.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Facility code already exists: ${code}`);
    }
    return this.prisma.churchFacility.create({
      data: {
        code,
        name: dto.name.trim(),
        building: dto.building?.trim(),
        floor: dto.floor?.trim(),
        capacity: dto.capacity,
        requiresAdminNotify: dto.requiresAdminNotify ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(actorUserId: string, id: string, dto: UpsertFacilityDto) {
    await this.assertManage(actorUserId);
    const row = await this.prisma.churchFacility.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Facility not found');

    const code = dto.code.trim().toUpperCase();
    if (code !== row.code) {
      const clash = await this.prisma.churchFacility.findUnique({
        where: { code },
      });
      if (clash) {
        throw new ConflictException(`Facility code already exists: ${code}`);
      }
    }

    return this.prisma.churchFacility.update({
      where: { id },
      data: {
        code,
        name: dto.name.trim(),
        building: dto.building?.trim(),
        floor: dto.floor?.trim(),
        capacity: dto.capacity,
        requiresAdminNotify: dto.requiresAdminNotify,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }
}
