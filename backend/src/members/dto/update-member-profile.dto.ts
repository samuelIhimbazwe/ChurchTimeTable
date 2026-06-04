import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ChoirVoicePart, MemberGender } from '@prisma/client';

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsEnum(MemberGender)
  gender?: MemberGender;

  @IsOptional()
  @IsEnum(ChoirVoicePart)
  voicePart?: ChoirVoicePart;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsDateString()
  baptismDate?: string;

  @IsOptional()
  @IsDateString()
  choirJoinDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  instruments?: string[];
}
