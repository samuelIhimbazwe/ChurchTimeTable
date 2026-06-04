import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";
const API_BASE = "http://localhost:3001/api/v1";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("member without family leadership sees unavailable workspace", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/family/contributions");
  await expect(page.getByText("Family workspace unavailable")).toBeVisible({
    timeout: 30_000,
  });
});

test("family secretary context is view-only", async ({ request }) => {
  const login = await request.post(`${API_BASE}/auth/login`, {
    data: { email: "member2@church.local", password: PILOT_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.accessToken as string;

  const ctx = await request.get(`${API_BASE}/finance/contributions/family/context`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(ctx.ok()).toBeTruthy();
  const body = await ctx.json();
  const family = body.data.families[0];
  expect(family).toBeTruthy();
  expect(family.canApprove).toBe(false);
  expect(family.isViewOnly).toBe(true);
});
