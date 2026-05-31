import { ForbiddenException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { MemberPhoneEnforcementService } from './member-phone-enforcement.service';
import { ROLES } from '../constants/roles';
import {
  PHONE_ENFORCEMENT_ENABLED_KEY,
  PHONE_ENFORCEMENT_MODE_KEY,
} from './phone-enforcement.constants';

describe('MemberPhoneEnforcementService', () => {
  const prisma = {
    systemSetting: {
      findMany: jest.fn(),
    },
    member: {
      findFirst: jest.fn(),
    },
  };

  const service = new MemberPhoneEnforcementService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockSettings(enabled: boolean, mode: string) {
    prisma.systemSetting.findMany.mockResolvedValue([
      { key: PHONE_ENFORCEMENT_ENABLED_KEY, value: enabled },
      { key: PHONE_ENFORCEMENT_MODE_KEY, value: mode },
    ]);
  }

  function mockMember(status: MemberStatus, phone: string | null) {
    prisma.member.findFirst.mockResolvedValue({ status, phone });
  }

  it('allows operations in soft mode without blocking', async () => {
    mockSettings(true, 'soft');
    mockMember(MemberStatus.ACTIVE, null);

    await expect(
      service.assertCanOperate('user-1', [ROLES.MEMBER]),
    ).resolves.toBeUndefined();
    expect(await service.canOperate('user-1', [ROLES.MEMBER])).toBe(true);
  });

  it('allows operations in warning mode without blocking', async () => {
    mockSettings(true, 'warning');
    mockMember(MemberStatus.ACTIVE, null);

    await expect(
      service.assertCanOperate('user-1', [ROLES.MEMBER]),
    ).resolves.toBeUndefined();
  });

  it('blocks operations in strict mode for missing phone', async () => {
    mockSettings(true, 'strict');
    mockMember(MemberStatus.ACTIVE, null);

    await expect(
      service.assertCanOperate('user-1', [ROLES.MEMBER]),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('exempts admin roles in strict mode', async () => {
    mockSettings(true, 'strict');
    mockMember(MemberStatus.ACTIVE, null);

    await expect(
      service.assertCanOperate('user-1', [ROLES.SUPER_ADMIN]),
    ).resolves.toBeUndefined();
    await expect(
      service.assertCanOperate('user-1', [ROLES.CHURCH_ADMIN]),
    ).resolves.toBeUndefined();
  });

  it('does not enforce on inactive members', async () => {
    mockSettings(true, 'strict');
    mockMember(MemberStatus.INACTIVE, null);

    expect(service.requiresPhone({ status: MemberStatus.INACTIVE, phone: null }, [ROLES.MEMBER])).toBe(false);
    await expect(
      service.assertCanOperate('user-1', [ROLES.MEMBER]),
    ).resolves.toBeUndefined();
  });

  it('builds auth enforcement state', async () => {
    mockSettings(true, 'strict');
    mockMember(MemberStatus.PENDING, null);

    const state = await service.buildAuthEnforcementState('user-1', [
      ROLES.MEMBER,
    ]);

    expect(state).toEqual({
      enabled: true,
      mode: 'strict',
      blocked: true,
    });
  });
});
