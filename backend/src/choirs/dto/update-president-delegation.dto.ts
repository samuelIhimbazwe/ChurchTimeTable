import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePresidentDelegationDto {
  @IsOptional()
  @IsBoolean()
  presidentOutOfOffice?: boolean;

  @IsOptional()
  @IsBoolean()
  presidentDelegationJoinReview?: boolean;
}
