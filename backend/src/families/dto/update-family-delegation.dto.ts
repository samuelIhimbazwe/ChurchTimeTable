import { IsBoolean } from 'class-validator';

export class UpdateFamilyDelegationDto {
  @IsBoolean()
  delegationEnabled!: boolean;
}
