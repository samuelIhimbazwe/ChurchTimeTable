import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Prepares an isolated SQLite database for E2E runs so tests do not depend on
 * Docker Postgres or a pre-existing developer .env file.
 */
export default async function globalSetup() {
  const backendRoot = path.resolve(__dirname, '..');
  const dbPath = path.join(backendRoot, 'prisma', 'e2e-test.db');
  const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  process.env.DATABASE_URL = dbUrl;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-jwt-secret';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'e2e-test-refresh-secret';

  const env = {
    ...process.env,
    DATABASE_URL: dbUrl,
  };

  execSync('npx prisma generate', {
    cwd: backendRoot,
    stdio: 'inherit',
    env,
  });

  // Migrations are authored for PostgreSQL; E2E uses SQLite via schema push.
  execSync('npx prisma db push --accept-data-loss', {
    cwd: backendRoot,
    stdio: 'inherit',
    env,
  });

  execSync('npm run prisma:seed', {
    cwd: backendRoot,
    stdio: 'inherit',
    env,
  });
}
