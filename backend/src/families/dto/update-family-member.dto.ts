import { FamilyMemberRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateFamilyMemberDto {
  @IsEnum(FamilyMemberRole)
  role!: FamilyMemberRole;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
