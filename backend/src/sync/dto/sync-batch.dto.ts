import { IsArray, IsDateString, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncItemDto {
  @IsString()
  entity: string;

  @IsString()
  entityId: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsDateString()
  clientUpdatedAt: string;
}

export class SyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items: SyncItemDto[];
}
