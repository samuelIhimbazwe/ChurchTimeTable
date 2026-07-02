import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AccountInviteType } from '@prisma/client';

export class CreateAccountInviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEnum(AccountInviteType)
  inviteType!: AccountInviteType;

  @ValidateIf((o: CreateAccountInviteDto) =>
    o.inviteType === AccountInviteType.CHOIR ||
    o.inviteType === AccountInviteType.DUAL,
  )
  @IsString()
  @MinLength(1)
  choirId?: string;
}
