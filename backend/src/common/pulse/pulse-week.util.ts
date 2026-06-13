import { BadRequestException } from '@nestjs/common';

export function startOfWeekUtc(date: Date): Date {
  const copy = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function resolvePulseWeekStart(value?: string): Date {
  if (value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid weekStart');
    }
    return startOfWeekUtc(parsed);
  }
  return startOfWeekUtc(new Date());
}
