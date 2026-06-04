import { FamilyMemberRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  familyName!: string;

  @IsOptional()
  @IsUUID()
  headMemberId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateFamilyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  familyName?: string;

  @IsOptional()
  @IsUUID()
  headMemberId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  delegationEnabled?: boolean;
}

export class AddFamilyMemberDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @IsEnum(FamilyMemberRole)
  role?: FamilyMemberRole;
}
