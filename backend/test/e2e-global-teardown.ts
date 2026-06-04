import * as fs from 'node:fs';
import * as path from 'node:path';

export default async function globalTeardown() {
  const dbPath = path.resolve(__dirname, '../prisma/e2e-test.db');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // Windows file lock — leave artifact for inspection
    }
  }
}
