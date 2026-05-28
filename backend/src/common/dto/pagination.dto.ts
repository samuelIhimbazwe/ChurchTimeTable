import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function paginate(page = 1, limit = 20) {
  const p = Math.max(1, Number(page) || 1);
  const take = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * take;
  return { skip, take };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  return {
    items,
    meta: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1,
    },
  };
}
