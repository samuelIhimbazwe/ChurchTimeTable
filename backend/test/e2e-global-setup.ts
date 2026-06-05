import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

function prismaClientReady(backendRoot: string) {
  return fs.existsSync(
    path.join(backendRoot, 'node_modules', '.prisma', 'client', 'index.js'),
  );
}

function runPrismaGenerate(backendRoot: string, env: NodeJS.ProcessEnv) {
  if (process.env.CMMS_E2E_SKIP_GENERATE === '1' && prismaClientReady(backendRoot)) {
    console.warn('[e2e setup] skipping prisma generate (CMMS_E2E_SKIP_GENERATE=1)');
    return;
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      execSync('npx prisma generate', {
        cwd: backendRoot,
        stdio: 'inherit',
        env,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isLockError =
        message.includes('EPERM') ||
        message.includes('operation not permitted') ||
        message.includes('EBUSY');

      if (prismaClientReady(backendRoot) && isLockError) {
        console.warn(
          '[e2e setup] prisma generate hit a file lock but an existing client was found — continuing',
        );
        return;
      }

      if (!isLockError || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = attempt * 1500;
      console.warn(
        `[e2e setup] prisma generate attempt ${attempt} failed (file lock). Retrying in ${delayMs}ms…`,
      );
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }
}

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
    CMMS_E2E: '1',
    DISABLE_REMINDER_CRON: '1',
  };

  runPrismaGenerate(backendRoot, env);

  // Migrations are authored for PostgreSQL; E2E uses SQLite via schema push.
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
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
