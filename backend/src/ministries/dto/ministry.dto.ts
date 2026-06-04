import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MINISTRY_SCOPED_PERMISSIONS } from '../../common/constants/roles';

export class CreateMinistryDto {
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
}

export class UpdateMinistryDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  isActive?: boolean;
}

export class AddMinistryMemberDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateMinistryMemberDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'REMOVED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'REMOVED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AssignMinistryLeadershipDto {
  @IsUUID()
  memberId!: string;

  @IsUUID()
  positionId!: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class EndMinistryLeadershipDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}

export class GrantMinistryPermissionDto {
  @IsUUID()
  memberId!: string;

  @IsString()
  @IsIn([...MINISTRY_SCOPED_PERMISSIONS])
  permission!: string;
}

export class UpdateMinistrySettingsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowDevotions?: boolean;

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
  allowMeetings?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowAssets?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowOperationalUnits?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  allowReporting?: boolean;
}
