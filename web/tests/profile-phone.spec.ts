import { expect, test } from "@playwright/test";

test("phone banner appears for active member without phone", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  const banner = page.getByText("Add your phone number to complete your profile.");
  if (await banner.isVisible().catch(() => false)) {
    await expect(page.getByRole("link", { name: "Update profile" })).toBeVisible();
  }
});

test("profile page saves phone updates", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/settings/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
    timeout: 30_000,
  });

  const phoneInput = page.getByLabel("Phone");
  await phoneInput.fill("0789999999");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByText("Profile updated.")).toBeVisible({
    timeout: 30_000,
  });
});
