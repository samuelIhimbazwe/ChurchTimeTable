import { expect, test } from "@playwright/test";

test("leader can open coverage management workspace", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/coverage");
  await expect(page).toHaveURL(/\/en\/dashboard\/coverage$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Coverage management" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Swaps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replacements" })).toBeVisible();

  await page.getByRole("button", { name: "Coordinator oversight" }).click();
  await expect(
    page.getByRole("heading", { name: "Coordinator coverage dashboard" }),
  ).toBeVisible({
    timeout: 15_000,
  });
});
