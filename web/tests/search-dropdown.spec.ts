import { expect, test } from "@playwright/test";

test("leader top-nav search shows grouped results", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  const searchInput = page.getByPlaceholder("Search members, families, events…");
  await searchInput.fill("Choir");
  await expect(page.getByText("Events")).toBeVisible({ timeout: 15_000 });
});
