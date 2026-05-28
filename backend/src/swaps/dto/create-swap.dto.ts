import { IsUUID } from 'class-validator';

export class CreateSwapDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  targetId: string;
}
