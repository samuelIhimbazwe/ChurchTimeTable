import { ForbiddenException, Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES } from '../constants/roles';
import {
  DEFAULT_PHONE_ENFORCEMENT,
  PHONE_ENFORCEMENT_ENABLED_KEY,
  PHONE_ENFORCEMENT_MODE_KEY,
  parsePhoneEnforcementMode,
  type PhoneEnforcementMode,
} from './phone-enforcement.constants';

const PHONE_EXEMPT_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.CHURCH_ADMIN,
]);

const ENFORCEMENT_STATUSES = new Set<MemberStatus>([
  MemberStatus.ACTIVE,
  MemberStatus.NEW_MEMBER,
  MemberStatus.PROBATION,
]);

export type PhoneEnforcementState = {
  enabled: boolean;
  mode: PhoneEnforcementMode;
  blocked: boolean;
};

@Injectable()
export class MemberPhoneEnforcementService {
  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<{
    enabled: boolean;
    mode: PhoneEnforcementMode;
  }> {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: { in: [PHONE_ENFORCEMENT_ENABLED_KEY, PHONE_ENFORCEMENT_MODE_KEY] },
      },
    });

    const byKey = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const enabledRaw = byKey[PHONE_ENFORCEMENT_ENABLED_KEY];
    const enabled =
      typeof enabledRaw === 'boolean'
        ? enabledRaw
        : DEFAULT_PHONE_ENFORCEMENT.enabled;

    return {
      enabled,
      mode: enabled
        ? parsePhoneEnforcementMode(byKey[PHONE_ENFORCEMENT_MODE_KEY])
        : DEFAULT_PHONE_ENFORCEMENT.mode,
    };
  }

  async getEnforcementMode(): Promise<PhoneEnforcementMode> {
    const settings = await this.getSettings();
    if (!settings.enabled) {
      return 'soft';
    }
    return settings.mode;
  }

  isExemptRole(roles: string[]): boolean {
    return roles.some((role) => PHONE_EXEMPT_ROLES.has(role));
  }

  memberMissingPhone(member: {
    status: MemberStatus | string;
    phone?: string | null;
  } | null): boolean {
    if (!member) return false;
    if (!ENFORCEMENT_STATUSES.has(member.status as MemberStatus)) {
      return false;
    }
    return !member.phone;
  }

  requiresPhone(
    member: {
      status: MemberStatus | string;
      phone?: string | null;
    } | null,
    roles: string[],
  ): boolean {
    if (this.isExemptRole(roles)) {
      return false;
    }
    return this.memberMissingPhone(member);
  }

  async canOperate(userId: string, roles: string[]): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.enabled || settings.mode !== 'strict') {
      return true;
    }

    if (this.isExemptRole(roles)) {
      return true;
    }

    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { status: true, phone: true },
    });

    if (!this.memberMissingPhone(member)) {
      return true;
    }

    return false;
  }

  async assertCanOperate(userId: string, roles: string[]): Promise<void> {
    const can = await this.canOperate(userId, roles);
    if (!can) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        messageKey: 'PHONE_REQUIRED',
      });
    }
  }

  async buildAuthEnforcementState(
    userId: string,
    roles: string[],
  ): Promise<PhoneEnforcementState> {
    const settings = await this.getSettings();
    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { status: true, phone: true },
    });

    const blocked =
      settings.enabled &&
      settings.mode === 'strict' &&
      this.requiresPhone(member, roles);

    return {
      enabled: settings.enabled,
      mode: settings.mode,
      blocked,
    };
  }
}
