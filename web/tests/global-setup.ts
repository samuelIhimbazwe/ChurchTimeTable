import type { FullConfig } from "@playwright/test";

export default async function globalSetup(_config: FullConfig) {
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:3000/api/v1";

  try {
    const health = await fetch(`${apiBase}/auth/me`, { method: "GET" });
    if (!health.ok && health.status !== 401) {
      throw new Error(`Backend not reachable at ${apiBase} (status ${health.status})`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Playwright global setup failed: ${message}`);
  }
}
