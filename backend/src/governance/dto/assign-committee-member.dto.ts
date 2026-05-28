import { IsString } from 'class-validator';

export class AssignCommitteeMemberDto {
  @IsString()
  scopeId: string;

  @IsString()
  memberId: string;

  @IsString()
  roleId: string;
}
