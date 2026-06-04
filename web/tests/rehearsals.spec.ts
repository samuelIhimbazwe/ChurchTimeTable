import { test, expect } from "@playwright/test";

async function loginAsChoirPresident(page: import("@playwright/test").Page) {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill("choir.president@church.local");
  await page.getByLabel(/password/i).fill("TestPass1!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe("Rehearsals web", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsChoirPresident(page);
  });

  test("rehearsals hub loads", async ({ page }) => {
    await page.goto("/en/dashboard/rehearsals");
    await expect(page.getByRole("heading", { name: /rehearsals/i })).toBeVisible();
  });

  test("readiness and attendance routes", async ({ page }) => {
    await page.goto("/en/dashboard/rehearsals/readiness");
    await expect(page.getByText(/section/i).first()).toBeVisible();
    await page.goto("/en/dashboard/rehearsals/attendance");
    await expect(page.getByText(/attendance/i).first()).toBeVisible();
  });
});
