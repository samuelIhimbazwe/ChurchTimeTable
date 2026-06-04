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

async function apiToken(email: string) {
  const login = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PILOT_PASSWORD }),
  });
  expect(login.ok).toBeTruthy();
  const body = (await login.json()) as { data: { accessToken: string } };
  return body.data.accessToken;
}

test("member sees own contributions list", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/contributions");
  await expect(page.getByRole("heading", { level: 1, name: "My contributions" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "Submit contribution" })).toBeVisible();
});

test("president sees own contributions center", async ({ page }) => {
  await signIn(page, "choir.president@church.local");
  await page.goto("/en/dashboard/contributions");
  await expect(page.getByRole("heading", { level: 1, name: "My contributions" })).toBeVisible({
    timeout: 30_000,
  });
});

test("treasurer sees own contributions and personal totals load", async ({ page, request }) => {
  await signIn(page, "choir.treasurer@church.local");
  await page.goto("/en/dashboard/contributions");
  await expect(page.getByRole("heading", { level: 1, name: "My contributions" })).toBeVisible({
    timeout: 30_000,
  });

  const token = await apiToken("choir.treasurer@church.local");
  const totals = await request.get(`${API_BASE}/finance/contributions/totals?scope=own`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(totals.ok()).toBeTruthy();
});

test("member cannot open another member contribution via API", async ({ request }) => {
  const memberToken = await apiToken("member1@church.local");
  const presidentToken = await apiToken("choir.president@church.local");

  const presidentMine = await request.get(`${API_BASE}/finance/contributions/member?limit=1`, {
    headers: { Authorization: `Bearer ${presidentToken}` },
  });
  expect(presidentMine.ok()).toBeTruthy();
  const presidentBody = await presidentMine.json();
  const otherId = presidentBody.data?.items?.[0]?.id as string | undefined;
  if (!otherId) {
    test.skip();
    return;
  }

  const forbidden = await request.get(`${API_BASE}/finance/contributions/${otherId}`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  expect(forbidden.status()).toBe(404);
});

test("submission form validates required fields", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/contributions/new");
  await expect(page.getByRole("heading", { name: "Submit contribution" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByLabel("Amount paid")).toBeFocused();
});

test("legacy my-contributions path redirects to contribution center", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/finance/my-contributions");
  await expect(page).toHaveURL(/\/en\/dashboard\/contributions\/?$/, { timeout: 30_000 });
});
