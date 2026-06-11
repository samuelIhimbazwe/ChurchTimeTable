import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum ChurchScheduleResolveAction {
  PUBLISH = 'PUBLISH',
  OVERRIDE = 'OVERRIDE',
  REJECT = 'REJECT',
  COUNTER_PROPOSE = 'COUNTER_PROPOSE',
}

export class ResolveChurchScheduleConflictDto {
  @IsEnum(ChurchScheduleResolveAction)
  action!: ChurchScheduleResolveAction;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
