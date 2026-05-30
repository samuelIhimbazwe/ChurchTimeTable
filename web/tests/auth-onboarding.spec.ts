import { expect, test, type Page } from "@playwright/test";

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:3000/api/v1";

async function gotoStable(page: Page, url: string, readySelector: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const reload = page.getByRole("button", { name: "Reload" });
    if (await reload.isVisible().catch(() => false)) {
      await reload.click();
      await page.waitForTimeout(1500);
      continue;
    }
    if (await page.locator(readySelector).isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(1500);
  }

  await expect(page.locator(readySelector)).toBeVisible({ timeout: 30_000 });
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test.describe.serial("auth onboarding flow", () => {
  const uniqueEmail = `signup.${Date.now()}@church.local`;
  const password = "Pilot@123";

  test("register page renders guided signup flow", async ({ page }) => {
    await gotoStable(page, "/en/register", "#firstName");
    await expect(
      page.getByRole("heading", { level: 1, name: /register with your church/i }),
    ).toBeVisible();
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible();
  });

  test("api signup then pending approval screen", async ({ page, request }) => {
    const registerResponse = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: uniqueEmail,
        password,
        firstName: "Test",
        lastName: "Member",
        ministry: "CHOIR",
        preferredLanguage: "en",
      },
    });
    expect(registerResponse.ok()).toBeTruthy();

    await gotoStable(page, "/en/login", "#email");
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/pending-approval/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /being reviewed/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("pending users cannot access dashboard", async ({ page, request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginBody = await loginResponse.json();
    const refreshToken = loginBody.data.refreshToken as string;

    await page.goto("/en/login");
    await page.context().addCookies([
      {
        name: "cmms_refresh_token",
        value: refreshToken,
        domain: "localhost",
        path: "/api/v1/auth",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/pending-approval/, { timeout: 60_000 });
  });
});

test("seeded pending pilot account lands on pending approval screen", async ({ page }) => {
  await gotoStable(page, "/en/login", "#email");
  await page.locator("#email").fill("pending.choir@church.local");
  await page.locator("#password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/pending-approval/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { name: /being reviewed/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Thank you, Ange Mukamana.")).toBeVisible({
    timeout: 15_000,
  });
});
