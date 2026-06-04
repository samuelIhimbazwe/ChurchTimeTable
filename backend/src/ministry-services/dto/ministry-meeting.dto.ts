import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class CreateMinistryMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateMinistryMeetingDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;
}

export class RecordMeetingAttendeeDto {
  @IsUUID()
  memberId!: string;

  @IsBoolean()
  present!: boolean;
}

export class CreateMeetingActionItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
