import * as path from 'node:path';

const dbPath = path.resolve(__dirname, '../prisma/e2e-test.db');
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-jwt-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'e2e-test-refresh-secret';
process.env.CMMS_E2E = '1';
process.env.DISABLE_REMINDER_CRON = '1';
process.env.CMMS_E2E_SKIP_GENERATE = '1';
