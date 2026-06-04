import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MemberStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  NEW_MEMBER: ['ACTIVE', 'PROBATION', 'TEMPORARILY_INACTIVE', 'TRANSFERRED'],
  ACTIVE: [
    'PROBATION',
    'TEMPORARILY_INACTIVE',
    'SUSPENDED',
    'DISCIPLINE',
    'TRANSFERRED',
    'GRADUATED',
    'RETIRED',
    'DECEASED',
  ],
  PROBATION: ['ACTIVE', 'SUSPENDED', 'TEMPORARILY_INACTIVE', 'TRANSFERRED'],
  TEMPORARILY_INACTIVE: ['ACTIVE', 'TRANSFERRED', 'RETIRED'],
  SUSPENDED: ['ACTIVE', 'DISCIPLINE', 'TRANSFERRED', 'RETIRED'],
  DISCIPLINE: ['ACTIVE', 'SUSPENDED', 'TRANSFERRED', 'RETIRED'],
  TRANSFERRED: [],
  GRADUATED: ['RETIRED'],
  RETIRED: [],
  DECEASED: [],
};

export function isValidMemberTransition(
  from: MemberStatus,
  to: MemberStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedMemberTransitions(
  from: MemberStatus,
): MemberStatus[] {
  return [...(ALLOWED_TRANSITIONS[from] ?? [])];
}

export class UpdateMemberStatusDto {
  @IsEnum(MemberStatus)
  status: MemberStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
