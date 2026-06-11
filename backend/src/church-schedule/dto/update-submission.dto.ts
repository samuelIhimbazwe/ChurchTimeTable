import { PartialType } from '@nestjs/mapped-types';
import { CreateChurchScheduleSubmissionDto } from './create-submission.dto';

export class UpdateChurchScheduleSubmissionDto extends PartialType(
  CreateChurchScheduleSubmissionDto,
) {}
