import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateAssignmentDto } from './create-assignment.dto';

export class BulkAssignDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentDto)
  assignments: CreateAssignmentDto[];
}
