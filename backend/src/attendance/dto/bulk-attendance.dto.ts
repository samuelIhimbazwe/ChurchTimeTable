import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { UpsertAttendanceDto } from './upsert-attendance.dto';

export class BulkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAttendanceDto)
  records: UpsertAttendanceDto[];
}
