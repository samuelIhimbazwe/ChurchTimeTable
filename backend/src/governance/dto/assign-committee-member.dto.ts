import { IsOptional, IsString } from 'class-validator';

export class AssignCommitteeMemberDto {
  @IsString()
  scopeId: string;

  @IsString()
  memberId: string;

  @IsString()
  roleId: string;

  /** Optional effective start — defaults to now when assigning or re-opening a seat. */
  @IsOptional()
  @IsString()
  effectiveStart?: string;
}
