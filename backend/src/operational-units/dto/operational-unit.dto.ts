import { OperationalUnitType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OPERATIONAL_UNIT_SCOPED_PERMISSIONS } from '../../common/constants/roles';

export class CreateOperationalUnitDto {
  @IsUUID()
  ministryId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(OperationalUnitType)
  type?: OperationalUnitType;
}

export class UpdateOperationalUnitDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(OperationalUnitType)
  type?: OperationalUnitType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  isActive?: boolean;
}

export class AddOperationalUnitMemberDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateOperationalUnitMemberDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'REMOVED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'REMOVED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AssignOperationalUnitLeadershipDto {
  @IsUUID()
  memberId!: string;

  @IsUUID()
  positionId!: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class EndOperationalUnitLeadershipDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}

export class GrantOperationalUnitPermissionDto {
  @IsUUID()
  memberId!: string;

  @IsString()
  @IsIn([...OPERATIONAL_UNIT_SCOPED_PERMISSIONS])
  permission!: string;
}

export class UpdateOperationalUnitSettingsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowAttendance?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowReports?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowAnnouncements?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowDocuments?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowAssets?: boolean;
}
