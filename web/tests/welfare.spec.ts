import { expect, test } from "@playwright/test";

async function loginPresident(page: import("@playwright/test").Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test.describe("Welfare module", () => {
  test("welfare dashboard loads", async ({ page }) => {
    await loginPresident(page);
    await page.goto("/en/dashboard/welfare");
    await expect(page.getByRole("heading", { level: 1, name: "Welfare" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("welfare reports page loads", async ({ page }) => {
    await loginPresident(page);
    await page.goto("/en/dashboard/welfare/reports");
    await expect(
      page.getByRole("heading", { level: 1, name: "Welfare reports" }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
