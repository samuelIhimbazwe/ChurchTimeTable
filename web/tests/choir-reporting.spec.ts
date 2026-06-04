import { expect, test } from "@playwright/test";

async function loginPresident(page: import("@playwright/test").Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("choir reporting center loads", async ({ page }) => {
  await loginPresident(page);
  await page.goto("/en/dashboard/choir/reports");
  await expect(
    page.getByRole("heading", { level: 1, name: "Choir reporting center" }),
  ).toBeVisible({ timeout: 30_000 });
});
