import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountInviteStatus, AccountInviteType } from '@prisma/client';

export class ListAccountInvitesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(AccountInviteStatus)
  status?: AccountInviteStatus;

  @IsOptional()
  @IsEnum(AccountInviteType)
  inviteType?: AccountInviteType;
}
