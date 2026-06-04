import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum WelfareTransitionAction {
  SUBMIT = 'submit',
  START_FUNDRAISING = 'start_fundraising',
  COMPLETE = 'complete',
  CLOSE = 'close',
}

export class TransitionWelfareCaseDto {
  @IsEnum(WelfareTransitionAction)
  action: WelfareTransitionAction;

  @IsOptional()
  @IsString()
  notes?: string;
}
