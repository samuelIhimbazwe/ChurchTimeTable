export const REFRESH_COOKIE_NAME = 'cmms_refresh_token';

export function durationToMs(expression: string, fallbackMs: number): number {
  const match = /^(\d+)([smhd])$/i.exec(expression.trim());
  if (!match) {
    return fallbackMs;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}
