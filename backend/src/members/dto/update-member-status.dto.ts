import { IsEnum } from 'class-validator';
import { MemberStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  PENDING: ['ACTIVE', 'INACTIVE'],
  ACTIVE: ['INACTIVE', 'SUSPENDED', 'ALUMNI'],
  INACTIVE: ['ACTIVE', 'ALUMNI'],
  SUSPENDED: ['ACTIVE', 'INACTIVE'],
  ALUMNI: [],
};

export function isValidMemberTransition(
  from: MemberStatus,
  to: MemberStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export class UpdateMemberStatusDto {
  @IsEnum(MemberStatus)
  status: MemberStatus;
}
