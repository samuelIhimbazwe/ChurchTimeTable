import { expect, test } from "@playwright/test";

test.describe("auth lifecycle", () => {
  test("signup lands on pending approval screen", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/en/register");
    await page.getByLabel("First name").fill("Test");
    await page.getByLabel("Last name").fill("User");
    await page.getByLabel("Email").fill(`lifecycle.${stamp}@church.local`);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Password", { exact: true }).fill("Pilot@123");
    await page.getByLabel("Confirm password").fill("Pilot@123");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit registration" }).click();
    await expect(page).toHaveURL(/\/en\/pending-approval/, { timeout: 60_000 });
  });

  test("register page is reachable from login", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByRole("link", { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/en\/register/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("logout clears session and blocks dashboard", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("member@church.local");
    await page.getByLabel("Password").fill("Pilot@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 30_000 });

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 30_000 });
  });
});

test.describe("responsive operational shell", () => {
  test("member dashboard menu works on mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("member@church.local");
    await page.getByLabel("Password").fill("Pilot@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("attendance tabs visible on tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("protocol.coordinator@church.local");
    await page.getByLabel("Password").fill("Pilot@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

    await page.goto("/en/dashboard/attendance");
    await expect(page.getByRole("button", { name: "Mark attendance" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
