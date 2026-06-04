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

test("president can open executive stewardship overview", async ({ page }) => {
  await signIn(page, "choir.president@church.local");
  await page.goto("/en/dashboard/stewardship");
  await expect(
    page.getByRole("heading", { level: 1, name: "Stewardship overview" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Campaign progress")).toBeVisible();
});

test("member cannot access executive stewardship", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/stewardship");
  await expect(page.getByText("Executive stewardship unavailable")).toBeVisible({
    timeout: 30_000,
  });
});

test("treasurer rankings API returns choir scope", async ({ request }) => {
  const login = await request.post(`${API_BASE}/auth/login`, {
    data: { email: "choir.treasurer@church.local", password: PILOT_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.accessToken as string;

  const rankings = await request.get(`${API_BASE}/finance/contributions/rankings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(rankings.ok()).toBeTruthy();
  const body = await rankings.json();
  expect(body.data.scope).toBe("choir");
});

test("member rankings API is hidden", async ({ request }) => {
  const login = await request.post(`${API_BASE}/auth/login`, {
    data: { email: "member1@church.local", password: PILOT_PASSWORD },
  });
  const token = (await login.json()).data.accessToken as string;

  const rankings = await request.get(`${API_BASE}/finance/contributions/rankings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(rankings.status()).toBe(404);
});
