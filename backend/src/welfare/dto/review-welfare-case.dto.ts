import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum WelfareReviewAction {
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CLARIFICATION = 'request_clarification',
}

export class ReviewWelfareCaseDto {
  @IsEnum(WelfareReviewAction)
  action: WelfareReviewAction;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;
}
