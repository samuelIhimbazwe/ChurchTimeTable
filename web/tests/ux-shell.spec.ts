import { expect, test } from "@playwright/test";

test("member shell shows workflow navigation groups", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByText("Today")).toBeVisible();
  await expect(page.getByText("My ministry")).toBeVisible();
  await expect(page.getByRole("link", { name: "My contributions" })).toBeVisible();
});

test("dark mode toggle preserves readable shell", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
